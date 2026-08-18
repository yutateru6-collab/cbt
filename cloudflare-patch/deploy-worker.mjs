import fs from "node:fs";
import crypto from "node:crypto";

const API = "https://api.cloudflare.com/client/v4";
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const OPTIONAL_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const WORKER_NAME = "tg-lesson-memo";
const WORKER_URL = "https://tg-lesson-memo.itisnowornever271.workers.dev";
const RESULT_PATH = "cloudflare-deploy-result.json";
const original = fs.readFileSync("cloudflare-inspect/worker-current.js", "utf8");
const patched = fs.readFileSync("cloudflare-patch/worker-patched.js", "utf8");
const baselineSettings = JSON.parse(
  fs.readFileSync("cloudflare-inspect/settings-safe.json", "utf8")
);

const result = {
  worker: WORKER_NAME,
  verified: false,
  stage: "starting",
  mode: null,
  rolledBack: false,
  sourceSha256: sha(patched),
  settingsVerified: false,
  runtimeCheck: null,
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
  return TOKEN ? text.replaceAll(TOKEN, "[REDACTED]").slice(0, 2000) : text.slice(0, 2000);
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

function normalizeSafeSettings(value) {
  const settings = value?.result || value || {};
  const allow = [
    "name", "type", "namespace_id", "namespace", "database_id", "database_name",
    "bucket_name", "service", "environment", "class_name", "script_name",
    "queue_name", "index_name", "id"
  ];
  const bindings = Array.isArray(settings.bindings)
    ? settings.bindings.map((binding) => Object.fromEntries(
        allow.filter((key) => binding?.[key] !== undefined).map((key) => [key, binding[key]])
      )).sort((a, b) => `${a.name || ""}:${a.type || ""}`.localeCompare(`${b.name || ""}:${b.type || ""}`))
    : [];
  return {
    compatibility_date: settings.compatibility_date || null,
    compatibility_flags: settings.compatibility_flags || [],
    main_module: settings.main_module || null,
    usage_model: settings.usage_model || null,
    placement: settings.placement || null,
    bindings
  };
}

async function locateAccount() {
  if (!TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is missing");
  const candidates = [];
  if (OPTIONAL_ACCOUNT_ID) {
    candidates.push(OPTIONAL_ACCOUNT_ID);
  } else {
    const response = await apiFetch("/accounts?per_page=50");
    const data = await jsonOrThrow(response, "list accounts");
    for (const account of data.result || []) if (account?.id) candidates.push(account.id);
  }
  for (const accountId of candidates) {
    const response = await apiFetch(`/accounts/${accountId}/workers/scripts/${WORKER_NAME}/settings`);
    if (response.ok) return accountId;
  }
  throw new Error(`Worker ${WORKER_NAME} was not found in accessible accounts`);
}

async function getSafeSettings(accountId) {
  const response = await apiFetch(`/accounts/${accountId}/workers/scripts/${WORKER_NAME}/settings`);
  const data = await jsonOrThrow(response, "get Worker settings");
  return normalizeSafeSettings(data);
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

async function inspectRuntime() {
  const response = await fetch(`${WORKER_URL}/api/health`, {
    cache: "no-store",
    redirect: "follow"
  });
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json")) {
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("health endpoint returned malformed JSON");
    }
    result.health = data;
    if (!response.ok || data?.ok !== true || data?.studentProfiles !== true) {
      throw new Error(`health endpoint did not expose studentProfiles=true: ${JSON.stringify(data).slice(0, 500)}`);
    }
    result.runtimeCheck = "health-json";
    return;
  }
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(text)) {
    result.runtimeCheck = "cloudflare-access-protected";
    result.health = {
      protected: true,
      status: response.status,
      contentType
    };
    return;
  }
  throw new Error(`unexpected health response: ${response.status} ${contentType}`);
}

async function rollback(accountId) {
  await updateContent(accountId, original);
  const restored = await downloadWorkerSource(accountId);
  if (sha(restored) !== sha(original)) {
    throw new Error("rollback source verification failed");
  }
  result.rolledBack = true;
}

let accountId = null;
let changedProduction = false;
try {
  result.stage = "locate-account";
  accountId = await locateAccount();

  result.stage = "verify-baseline-settings";
  const beforeSettings = await getSafeSettings(accountId);
  const normalizedBaseline = normalizeSafeSettings(baselineSettings);
  if (JSON.stringify(beforeSettings) !== JSON.stringify(normalizedBaseline)) {
    throw new Error("Worker settings changed after the inspection snapshot; refusing deployment");
  }

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

  result.stage = "verify-source";
  const deployed = await downloadWorkerSource(accountId);
  if (sha(deployed) !== patchedSha) {
    throw new Error("Deployed Worker source hash does not match the validated patch");
  }
  if (!deployed.includes("CREATE TABLE IF NOT EXISTS student_profiles") || !deployed.includes("studentProfiles: true")) {
    throw new Error("Deployed Worker is missing student profile feature markers");
  }

  result.stage = "verify-settings-unchanged";
  const afterSettings = await getSafeSettings(accountId);
  if (JSON.stringify(afterSettings) !== JSON.stringify(beforeSettings)) {
    throw new Error("Worker bindings/settings changed during content-only deployment");
  }
  result.settingsVerified = true;

  result.stage = "inspect-runtime-access";
  await inspectRuntime();

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
      result.error += `; rollback: ${safeError(rollbackError)}`;
    }
  }
  result.stage = result.rolledBack ? "rolled-back" : result.stage;
  saveResult();
  console.error(JSON.stringify(result));
  process.exitCode = 1;
}
