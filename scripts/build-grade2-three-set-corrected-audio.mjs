import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { GRADE2_LISTENING_SOURCE_RELEASE } from "../listening-audio-fix.js";
import {
  GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
  fixGrade2ThreeSetOneSecondPausesWav,
} from "../grade2-listening-three-set-audio-fix.js";

const outputArg = process.argv.find((arg) => arg.startsWith("--output-dir="));
if (!outputArg) {
  throw new Error("Usage: node scripts/build-grade2-three-set-corrected-audio.mjs --output-dir=<dir>");
}
const outputDir = path.resolve(outputArg.slice("--output-dir=".length));
const sourceRoot =
  `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${GRADE2_LISTENING_SOURCE_RELEASE}`;
const manifest = JSON.parse(
  fs.readFileSync(
    new URL("../audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json", import.meta.url),
    "utf8",
  ),
);
const manifestById = new Map(manifest.items.map((item) => [item.id, item]));
const setKeys = ["set-01", "set-02", "set-03"];

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

async function fetchArrayBuffer(url) {
  const response = await fetch(url, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.arrayBuffer();
}

const built = [];
for (const setKey of setKeys) {
  for (let id = 1; id <= 30; id += 1) {
    const part = id <= 15 ? "part1" : "part2";
    const number = String(id).padStart(2, "0");
    const manifestId = `${setKey}/${part}/No${number}`;
    const item = manifestById.get(manifestId);
    if (!item) throw new Error(`Normalization manifest entry missing: ${manifestId}`);

    const sourceUrl =
      `${sourceRoot}/${setKey}/listening/${part}/No${number}.wav` +
      `?build=${encodeURIComponent(process.env.CBT_BUILD_SHA || Date.now())}`;
    const source = await fetchArrayBuffer(sourceUrl);
    const sourceSha = sha256(source);
    if (sourceSha !== item.outputSha256 || source.byteLength !== item.outputBytes) {
      throw new Error(
        `Immutable source mismatch for ${manifestId}: expected ${item.outputBytes}/${item.outputSha256}, ` +
          `got ${source.byteLength}/${sourceSha}`,
      );
    }

    const fixed = fixGrade2ThreeSetOneSecondPausesWav(source, id);
    if (
      fixed.targetIntroGapFrames !== 24000 ||
      fixed.targetBodyQuestionGapFrames !== 24000 ||
      fixed.targetQuestionGapFrames !== 19200
    ) {
      throw new Error(`Unexpected pause targets for ${manifestId}`);
    }

    const relativePath = path.join(setKey, "listening", part, `No${number}.wav`);
    const targetPath = path.join(outputDir, relativePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, Buffer.from(fixed.buffer));
    built.push({
      id: manifestId,
      relativePath: relativePath.split(path.sep).join("/"),
      bytes: fixed.buffer.byteLength,
      sha256: sha256(fixed.buffer),
      introFrames: fixed.targetIntroGapFrames,
      bodyQuestionFrames: fixed.targetBodyQuestionGapFrames,
      questionTextFrames: fixed.targetQuestionGapFrames,
    });
  }
}

if (built.length !== 90) throw new Error(`Expected 90 corrected WAVs, built ${built.length}`);
await writeFile(
  path.join(outputDir, "build-manifest.json"),
  `${JSON.stringify({ release: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE, count: built.length, items: built }, null, 2)}\n`,
  "utf8",
);
console.log(
  `Built ${built.length} corrected WAVs for ${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE} in ${outputDir}`,
);
