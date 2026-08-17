import fs from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { GRADE2_LISTENING_SOURCE_RELEASE } from "../listening-audio-fix.js";
import {
  GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
  fixGrade2Set01DuplicateQuestionV2FromOneSecondWav,
  fixGrade2ThreeSetOneSecondPausesWav,
} from "../grade2-listening-three-set-audio-fix.js";

const TARGET_IDS = Object.freeze([6, 7, 8, 10, 12, 14]);
const outputArg = process.argv.find((arg) => arg.startsWith("--output-dir="));
if (!outputArg) throw new Error("Usage: node scripts/build-set01-duplicate-question-v2-audio.mjs --output-dir=<dir>");
const outputDir = path.resolve(outputArg.slice("--output-dir=".length));
const sourceRoot = `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${GRADE2_LISTENING_SOURCE_RELEASE}/set-01/listening/part1`;
const manifest = JSON.parse(
  fs.readFileSync(new URL("../audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json", import.meta.url), "utf8"),
);
const byId = new Map(manifest.items.map((item) => [item.id, item]));

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

function pcm(buffer) {
  const bytes = Buffer.from(buffer);
  return bytes.subarray(44);
}

async function fetchSource(id) {
  const number = String(id).padStart(2, "0");
  const response = await fetch(`${sourceRoot}/No${number}.wav?build-v2=${encodeURIComponent(process.env.CBT_BUILD_SHA || Date.now())}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for No${number}`);
  return response.arrayBuffer();
}

const built = [];
for (const id of TARGET_IDS) {
  const number = String(id).padStart(2, "0");
  const manifestId = `set-01/part1/No${number}`;
  const item = byId.get(manifestId);
  if (!item) throw new Error(`Manifest entry missing: ${manifestId}`);
  const source = await fetchSource(id);
  if (source.byteLength !== item.outputBytes || sha256(source) !== item.outputSha256) {
    throw new Error(`${manifestId}: immutable source mismatch`);
  }

  const normal = fixGrade2ThreeSetOneSecondPausesWav(source, id);
  const fixed = fixGrade2Set01DuplicateQuestionV2FromOneSecondWav(normal.buffer, id);
  const normalPcm = pcm(normal.buffer);
  const fixedPcm = pcm(fixed.buffer);
  if (!fixedPcm.equals(normalPcm.subarray(0, fixed.trimFrame * 2))) {
    throw new Error(`${manifestId}: V2 output is not a byte-identical prefix of the accepted normal 1s WAV`);
  }

  const relativePath = `set-01/listening/part1/No${number}.wav`;
  const target = path.join(outputDir, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(fixed.buffer));
  built.push({
    id: manifestId,
    relativePath,
    bytes: fixed.buffer.byteLength,
    sha256: sha256(fixed.buffer),
    sourceFrames: fixed.sourceFrames,
    trimFrame: fixed.trimFrame,
    removedFrames: fixed.removedFrames,
  });
}

if (built.length !== 6) throw new Error(`Expected 6 V2 WAVs, built ${built.length}`);
await writeFile(
  path.join(outputDir, "build-manifest.json"),
  `${JSON.stringify({ release: GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE, count: built.length, items: built }, null, 2)}\n`,
  "utf8",
);
console.log(`Built exactly six Set 01 duplicate-question V2 WAVs in ${outputDir}`);
