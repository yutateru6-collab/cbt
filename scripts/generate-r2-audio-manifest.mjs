// LEGACY ONLY: this generator describes the historical 20260724-simba32 release.
// It must never overwrite or masquerade as the current production-audio index.
// Current Grade 2 listening production audio is documented in
// audio-generation/PRODUCTION_AUDIO.md and verified by
// audio-generation/20260815-grade2-listening-pauses-v2/r2-verification.json.

import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const bucket = "mimilisten-audio";
const publicBaseUrl =
  "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev";
const releasePrefix = "scbt/grade2/releases/20260724-simba32";
const outputPath = path.join(
  projectRoot,
  "audio-generation",
  "cloudflare-r2-production-audio-manifest-20260724-legacy.json",
);

const sourceGroups = [
  {
    localDirectory: "assets/audio/grade2/sample/part1/simba-3.2-final",
    keyDirectory: "sample/listening/part1",
  },
  {
    localDirectory: "assets/audio/grade2/sample/part2/simba-3.2-final",
    keyDirectory: "sample/listening/part2",
  },
  {
    localDirectory: "assets/audio/grade2/set-02/part1/simba-3.2-final",
    keyDirectory: "set-02/listening/part1",
  },
  {
    localDirectory: "assets/audio/grade2/set-02/part2/simba-3.2-final",
    keyDirectory: "set-02/listening/part2",
  },
  {
    localDirectory: "assets/audio/grade2/speaking/examiner",
    keyDirectory: "speaking/examiner",
  },
];

const objects = [];

for (const group of sourceGroups) {
  const absoluteDirectory = path.join(projectRoot, group.localDirectory);
  const fileNames = (await readdir(absoluteDirectory)).sort((a, b) =>
    a.localeCompare(b, "en"),
  );

  for (const fileName of fileNames) {
    const localPath = path.join(absoluteDirectory, fileName);
    if (!(await stat(localPath)).isFile()) continue;

    const file = await readFile(localPath);
    const key = `${releasePrefix}/${group.keyDirectory}/${fileName}`;
    const contentType = fileName.endsWith(".mp3") ? "audio/mpeg" : "audio/wav";

    objects.push({
      localPath: path.relative(projectRoot, localPath).replaceAll("\\", "/"),
      bucket,
      key,
      url: `${publicBaseUrl}/${key}`,
      contentType,
      bytes: file.byteLength,
      md5: createHash("md5").update(file).digest("hex"),
      sha256: createHash("sha256").update(file).digest("hex"),
    });
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  release: "20260724-simba32",
  status: "legacy",
  bucket,
  publicBaseUrl,
  cacheControl: "public, max-age=31536000, immutable",
  objectCount: objects.length,
  totalBytes: objects.reduce((total, object) => total + object.bytes, 0),
  objects,
};

await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${objects.length} LEGACY objects to ${outputPath}`);
