import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const verificationPath = join(
  root,
  "audio-generation",
  "20260815-gemini-speaking-kore-v5",
  "r2-verification.json",
);
const verification = JSON.parse(await readFile(verificationPath, "utf8"));
const baseUrl = new URL(String(process.argv[2] || ""));

if (!/^https?:$/.test(baseUrl.protocol)) throw new Error("Provide an http(s) Worker base URL.");
if (!Array.isArray(verification.items) || verification.items.length !== verification.count) {
  throw new Error("Speaking R2 verification manifest count is invalid.");
}

async function verifyItem(item) {
  const publicUrl = new URL(item.url);
  if (!publicUrl.pathname.startsWith("/scbt/")) {
    throw new Error(`Unexpected public speaking URL: ${item.url}`);
  }
  const workerPath = publicUrl.pathname.replace(/^\/scbt\//, "/audio-r2/");
  const url = new URL(workerPath, baseUrl);

  const head = await fetch(url, {
    method: "HEAD",
    headers: { "Cache-Control": "no-cache" },
  });
  if (head.status !== 200) throw new Error(`Speaking HEAD failed (${head.status}): ${url}`);
  if (!/^audio\/wav(?:;|$)/i.test(String(head.headers.get("content-type") || ""))) {
    throw new Error(`Unexpected speaking content type: ${url}`);
  }
  if (Number(head.headers.get("content-length")) !== item.bytes) {
    throw new Error(`Unexpected speaking content length: ${url}`);
  }

  const range = await fetch(url, {
    headers: { Range: "bytes=0-43", "Cache-Control": "no-cache" },
  });
  if (range.status !== 206) throw new Error(`Speaking range request failed (${range.status}): ${url}`);
  const bytes = Buffer.from(await range.arrayBuffer());
  if (bytes.length !== 44 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`Invalid speaking WAV header: ${url}`);
  }
  return url.href;
}

const queue = [...verification.items];
const verified = [];
await Promise.all(
  Array.from({ length: Math.min(6, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      verified.push(await verifyItem(item));
    }
  }),
);

console.log(`Verified ${verified.length} Grade 2 speaking WAVs through ${baseUrl.origin}.`);
