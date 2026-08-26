import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const verificationPath = join(
  root,
  "audio-generation",
  "20260815-gemini-speaking-kore-v5",
  "r2-verification.json",
);
const verification = JSON.parse(await readFile(verificationPath, "utf8"));
const bucketArg = process.argv.find((value) => value.startsWith("--buckets="));
const buckets = String(bucketArg?.slice("--buckets=".length) || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!buckets.length || buckets.some((bucket) => !/^[a-z0-9][a-z0-9-]*$/.test(bucket))) {
  throw new Error("Use --buckets=bucket-name[,backup-bucket-name].");
}
if (!Array.isArray(verification.items) || verification.items.length !== verification.count) {
  throw new Error("Speaking R2 verification manifest count is invalid.");
}

const wrangler = join(root, "node_modules", ".bin", "wrangler");
const stagingDir = await mkdtemp(join(tmpdir(), "cbt-speaking-r2-"));

try {
  for (const [index, item] of verification.items.entries()) {
    const sourceUrl = new URL(item.url);
    const key = sourceUrl.pathname.replace(/^\//, "");
    const expectedPrefix = `scbt/grade2/releases/${verification.release}/`;
    if (!key.startsWith(expectedPrefix) || !key.endsWith(".wav")) {
      throw new Error(`Unexpected speaking R2 key: ${key}`);
    }

    const response = await fetch(sourceUrl, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!response.ok) throw new Error(`Speaking source download failed (${response.status}): ${sourceUrl}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const digest = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== item.bytes || digest !== item.sha256) {
      throw new Error(`Speaking source integrity mismatch: ${sourceUrl}`);
    }

    const file = join(stagingDir, `${String(index + 1).padStart(2, "0")}.wav`);
    await writeFile(file, bytes);
    for (const bucket of buckets) {
      const result = spawnSync(
        wrangler,
        [
          "r2",
          "object",
          "put",
          `${bucket}/${key}`,
          "--file",
          file,
          "--content-type",
          "audio/wav",
          "--cache-control",
          "public, max-age=31536000, immutable",
          "--remote",
        ],
        { cwd: root, encoding: "utf8", stdio: "inherit" },
      );
      if (result.status !== 0) {
        throw new Error(`Wrangler failed to upload ${key} to ${bucket} (status ${result.status}).`);
      }
    }
    console.log(`[${index + 1}/${verification.count}] verified and uploaded ${relative(root, file)} -> ${key}`);
  }
} finally {
  await rm(stagingDir, { recursive: true, force: true });
}

console.log(`Synced ${verification.count} verified Grade 2 speaking WAVs to: ${buckets.join(", ")}`);
