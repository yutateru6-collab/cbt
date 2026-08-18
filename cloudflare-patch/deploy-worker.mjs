import fs from "node:fs";
import crypto from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const API = "https://api.cloudflare.com/client/v4";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const OPTIONAL_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const WORKER_NAME = "tg-lesson-memo";
const WORKER_URL = "https://tg-lesson-memo.itisnowornever271.workers.dev";
const RESULT_PATH = "cloudflare-deploy-result.json";
const original = fs.readFileSync("cloudflare-inspect/worker-current.js", "utf8");
const patched = fs.readFileSync("cloudflare-patch/worker-patched.js", "utf8");

const result = {
  worker: WORKER_NAME,
  verified: false,
  stage: "starting",
  mode: null,
  rolledBack: false,
  sourceSha256: sha(patched),
  health: null,
  error: null,
  verifiedAt: null
};

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function saveResult() {
  result.verifiedAt = new Date().toISOString();
  fs.writeFileSync(RESULT_PATH, JSON.stringify(result, null, 2) + "\n");
}

function safeError(error) {
  const text = error instanceof Error ? error.message : String(error);
  return text.replaceAll(TOKEN, "[REDACTED]").slice(0, 2000);
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${TOKEN}`);
  return fetch(`${API}${path}`, { ...options, headers });
}

async function jsonOrThrow(response, label) {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label}: non-JSON response (${response.status})`);
  }
  if (!response.ok || data.success === false) {
    throw new Error(`${label}: ${response.status} ${JSON.stringify(data.errors || data.messages || data).slice(0, 1000)}`);
  }
  return data;
}

async function locateAccount() {
  if (!TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is missing");
  const candidates = [];
  if (OPTIONAL_ACCOUNT_ID) {
    candidates.push(OPTIONAL_ACCOUNT_ID);
  } else {
    const response = await apiFetch("/accounts?per_page=50");
    const data = await jsonOrThrow(response, "list accounts");
    for (const account of data.result || []) {
      if (account?.id) candidates.push(account.id);
    }
  }
  for (const accountId of candidates) {
    const response = await apiFetch(`/accounts/${accountId}/workers/scripts/${WORKER_NAME}/settings`);
    if (response.ok) return accountId;
  }
  throw new Error(`Worker ${WORKER_NAME} was not found in accessible accounts`);
}

function extractIndexJs(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType || "");
  let boundary = boundaryMatch?.[1] || boundaryMatch?.[2] || "";
  const text = buffer.toString("utf8");
  if (!boundary && text.startsWith("--")) {
    const firstBreak = text.indexOf("\r\n");
    boundary = text.slice(2, firstBreak);
  }
  if (!boundary) throw new Error("Worker multipart boundary was not found");
  for (const part of text.split(`--${boundary}`)) {
    if (!/Content-Disposition:\s*form-data;\s*name="index\.js"/i.test(part)) continue;
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd < 0) throw new Error("Malformed index.js multipart part");
    return part.slice(headerEnd + 4).replace(/\r\n$/, "");
  }
  throw new Error("index.js was not found in Worker multipart response");
}

async function downloadWorkerSource(accountId) {
  const response = await apiFetch(`/accounts/${accountId}/workers/scripts/${WORKER_NAME}`);
  if (!response.ok) throw new Error(`download Worker: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  const buffer = Buffer.from(await response.arrayBuffer());
  return extractIndexJs(buffer, contentType);
}

async function updateContent(accountId, source) {
  const form = new FormData();
  form.append("metadata", JSON.stringify({ main_module: "index.js" }));
  form.append(
    "index.js",
    new Blob([source], { type: "application/javascript+module" }),
    "index.js"
  );
  const response = await apiFetch(
    `/accounts/${accountId}/workers/scripts/${WORKER_NAME}/content`,
    { method: "PUT", body: form }
  );
  return jsonOrThrow(response, "update Worker content");
}

async function verifyHealth() {
  let lastError = "health endpoint did not return the feature flag";
  for (let attempt = 0; attempt < 15; attempt += 1) {
    try {
      const response = await fetch(`${WORKER_URL}/api/health`, { cache: "no-store" });
      const data = await response.json();
      result.health = data;
      if (response.ok && data?.ok === true && data?.studentProfiles === true) return;
      lastError = `health ${response.status}: ${JSON.stringify(data).slice(0, 500)}`;
    } catch (error) {
      lastError = safeError(error);
    }
    await delay(2000);
  }
  throw new Error(lastError);
}

async function rollback(accountId) {
  try {
    await updateContent(accountId, original);
    result.rolledBack = true;
  } catch (error) {
    throw new Error(`rollback failed after deployment verification error: ${safeError(error)}`);
  }
}

let accountId = null;
let changedProduction = false;
try {
  result.stage = "locate-account";
  accountId = await locateAccount();

  result.stage = "compare-live-source";
  const live = await downloadWorkerSource(accountId);
  const liveSha = sha(live);
  const originalSha = sha(original);
  const patchedSha = sha(patched);

  if (liveSha === patchedSha) {
    result.mode = "already-present";
  } else if (liveSha === originalSha) {
    result.mode = "upload";
    result.stage = "upload-content";
    await updateContent(accountId, patched);
    changedProduction = true;
  } else {
    throw new Error(`Production source changed unexpectedly (${liveSha}); refusing to overwrite it`);
  }

  result.stage = "verify-health";
  await verifyHealth();

  result.stage = "verify-source";
  const deployed = await downloadWorkerSource(accountId);
  if (sha(deployed) !== patchedSha) {
    throw new Error("Deployed Worker source hash does not match the validated patch");
  }
  if (!deployed.includes("CREATE TABLE IF NOT EXISTS student_profiles")) {
    throw new Error("Deployed Worker is missing student_profiles schema code");
  }

  result.stage = "verified";
  result.verified = true;
  saveResult();
  console.log(JSON.stringify(result));
} catch (error) {
  result.error = safeError(error);
  if (accountId && (changedProduction || result.mode === "already-present")) {
    try {
      result.stage = "rollback";
      await rollback(accountId);
    } catch (rollbackError) {
      result.error += `; ${safeError(rollbackError)}`;
    }
  }
  result.stage = result.rolledBack ? "rolled-back" : result.stage;
  saveResult();
  console.error(JSON.stringify(result));
  process.exitCode = 1;
}
