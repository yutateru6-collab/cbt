import fs from "node:fs";
import { createHash } from "node:crypto";
import { GRADE2_LISTENING_SOURCE_RELEASE } from "../listening-audio-fix.js";
import {
  GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
  GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
  fixGrade2Set01DuplicateQuestionV2FromOneSecondWav,
  fixGrade2ThreeSetOneSecondPausesWav,
} from "../grade2-listening-three-set-audio-fix.js";

const args = process.argv.slice(2);
const expectedOnly = args.includes("--expected-only");
const publicBase = String(
  args.find((arg) => !arg.startsWith("--")) || process.env.CBT_PUBLIC_BASE_URL || "",
).replace(/\/+$/, "");
if (!expectedOnly && !publicBase) {
  throw new Error("Usage: node scripts/verify-cloudflare-listening-audio.mjs <worker-base-url> | --expected-only");
}

const sourceRoot = `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${GRADE2_LISTENING_SOURCE_RELEASE}`;
const manifest = JSON.parse(
  fs.readFileSync(new URL("../audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json", import.meta.url), "utf8"),
);
const manifestById = new Map(manifest.items.map((item) => [item.id, item]));
const setKeys = ["set-01", "set-02", "set-03"];
const duplicateQuestionFixIds = new Set([6, 7, 8, 10, 12, 14]);

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

function pcmData(buffer) {
  const bytes = Buffer.from(buffer);
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "data") return bytes.subarray(start, start + size);
    offset = start + size + (size % 2);
  }
  throw new Error("WAV data chunk missing");
}

async function fetchArrayBuffer(url) {
  const response = await fetch(url, {
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return { buffer: await response.arrayBuffer(), contentType: response.headers.get("content-type") || "" };
}

let verified = 0;
let overlayVerified = 0;
for (const setKey of setKeys) {
  for (let id = 1; id <= 30; id += 1) {
    const part = id <= 15 ? "part1" : "part2";
    const number = String(id).padStart(2, "0");
    const manifestId = `${setKey}/${part}/No${number}`;
    const item = manifestById.get(manifestId);
    if (!item) throw new Error(`Normalization manifest entry missing: ${manifestId}`);

    const sourceUrl = `${sourceRoot}/${setKey}/listening/${part}/No${number}.wav?verify-source=${encodeURIComponent(process.env.CBT_BUILD_SHA || Date.now())}`;
    const source = await fetchArrayBuffer(sourceUrl);
    const sourceSha = sha256(source.buffer);
    if (sourceSha !== item.outputSha256 || source.buffer.byteLength !== item.outputBytes) {
      throw new Error(`Immutable source mismatch for ${manifestId}: expected ${item.outputBytes}/${item.outputSha256}, got ${source.buffer.byteLength}/${sourceSha}`);
    }

    const normal = fixGrade2ThreeSetOneSecondPausesWav(source.buffer, id);
    if (!normal.changed) throw new Error(`Expected a verified correction for ${manifestId}`);
    if (normal.targetIntroGapFrames !== 24000) throw new Error(`${manifestId}: intro target is not exactly 24,000 frames`);
    if (normal.targetBodyQuestionGapFrames !== 24000) throw new Error(`${manifestId}: body->Question target is not exactly 24,000 frames`);
    if (normal.targetQuestionGapFrames !== 19200) throw new Error(`${manifestId}: Question->text target is not exactly 19,200 frames`);

    let expectedBuffer = normal.buffer;
    let release = GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE;
    let extraNote = "";
    if (setKey === "set-01" && part === "part1" && duplicateQuestionFixIds.has(id)) {
      const duplicateFixed = fixGrade2Set01DuplicateQuestionV2FromOneSecondWav(normal.buffer, id);
      const normalPcm = pcmData(normal.buffer);
      const fixedPcm = pcmData(duplicateFixed.buffer);
      if (!fixedPcm.equals(normalPcm.subarray(0, duplicateFixed.trimFrame * 2))) {
        throw new Error(`${manifestId}: V2 is not a byte-identical prefix of the accepted normal 1s WAV`);
      }
      expectedBuffer = duplicateFixed.buffer;
      release = GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE;
      extraNote = ` duplicateTrimV2=${duplicateFixed.trimFrame} removed=${duplicateFixed.removedFrames}`;
      overlayVerified += 1;
    }

    const expectedSha = sha256(expectedBuffer);
    const expectedBytes = expectedBuffer.byteLength;
    const pauseNote = `intro=${normal.targetIntroGapFrames}/1.000s bodyQuestion=${normal.targetBodyQuestionGapFrames}/1.000s questionText=${normal.targetQuestionGapFrames}/0.800s${extraNote}`;

    if (expectedOnly) {
      console.log(`${manifestId} expected=${expectedSha} bytes=${expectedBytes} release=${release} ${pauseNote}`);
      verified += 1;
      continue;
    }

    const actualUrl = `${publicBase}/audio-r2/grade2/releases/${release}/${setKey}/listening/${part}/No${number}.wav?verify=${encodeURIComponent(process.env.CBT_BUILD_SHA || Date.now())}`;
    const actual = await fetchArrayBuffer(actualUrl);
    if (!actual.contentType.toLowerCase().startsWith("audio/")) {
      throw new Error(`Unexpected content type for ${manifestId}: ${actual.contentType}`);
    }
    const actualSha = sha256(actual.buffer);
    const actualBytes = actual.buffer.byteLength;
    console.log(`${manifestId} expected=${expectedSha} actual=${actualSha} bytes=${actualBytes} release=${release} ${pauseNote}`);
    if (actualBytes !== expectedBytes || actualSha !== expectedSha) {
      throw new Error(`Cloudflare audio mismatch for ${manifestId}: expected ${expectedBytes}/${expectedSha}, got ${actualBytes}/${actualSha}`);
    }
    verified += 1;
  }
}

if (verified !== 90) throw new Error(`Expected 90 verified listening WAVs, got ${verified}`);
if (overlayVerified !== 6) throw new Error(`Expected exactly 6 V2 duplicate overlays, got ${overlayVerified}`);
if (expectedOnly) {
  console.log("Verified all 90 real Set 01-03 baseline masters and exactly six byte-prefix Set 01 V2 overlays");
} else {
  console.log(`Verified all 90 effective Set 01-03 listening WAVs, including exactly six V2 overlays, against ${publicBase}`);
}
