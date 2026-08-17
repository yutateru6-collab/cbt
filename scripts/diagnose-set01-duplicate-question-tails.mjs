import fs from "node:fs";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { GRADE2_LISTENING_SOURCE_RELEASE } from "../listening-audio-fix.js";
import { fixGrade2ThreeSetOneSecondPausesWav } from "../grade2-listening-three-set-audio-fix.js";

const TARGET_IDS = Object.freeze([6, 7, 8, 10, 12, 14]);
const SAMPLE_RATE = 24000;
const SILENCE_THRESHOLD = 350;
const outputArg = process.argv.find((arg) => arg.startsWith("--output-dir="));
const outputDir = outputArg ? path.resolve(outputArg.slice("--output-dir=".length)) : null;
const sourceRoot =
  `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${GRADE2_LISTENING_SOURCE_RELEASE}/set-01/listening/part1`;
const manifest = JSON.parse(
  fs.readFileSync(
    new URL("../audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json", import.meta.url),
    "utf8",
  ),
);
const manifestById = new Map(manifest.items.map((item) => [item.id, item]));

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

function parsePcmWav(buffer) {
  const bytes = Buffer.from(buffer);
  if (bytes.length < 44 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Unsupported WAV container");
  }
  let offset = 12;
  let format = null;
  let dataOffset = -1;
  let dataSize = -1;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    const end = start + size;
    if (end > bytes.length) throw new Error(`Invalid WAV chunk: ${id}`);
    if (id === "fmt ") {
      format = {
        audioFormat: bytes.readUInt16LE(start),
        channels: bytes.readUInt16LE(start + 2),
        sampleRate: bytes.readUInt32LE(start + 4),
        blockAlign: bytes.readUInt16LE(start + 12),
        bitsPerSample: bytes.readUInt16LE(start + 14),
      };
    } else if (id === "data") {
      dataOffset = start;
      dataSize = size;
      break;
    }
    offset = end + (size % 2);
  }
  if (!format || dataOffset < 0 || dataSize < 0) throw new Error("WAV fmt/data chunk missing");
  if (format.audioFormat !== 1 || format.channels !== 1 || format.sampleRate !== SAMPLE_RATE || format.bitsPerSample !== 16 || format.blockAlign !== 2) {
    throw new Error(`Unexpected WAV format: ${JSON.stringify(format)}`);
  }
  return {
    totalFrames: dataSize / 2,
    pcm: bytes.subarray(dataOffset, dataOffset + dataSize),
  };
}

function sample(parsed, frame) {
  return parsed.pcm.readInt16LE(frame * 2);
}

function isSilent(parsed, frame) {
  return Math.abs(sample(parsed, frame)) <= SILENCE_THRESHOLD;
}

function findSilenceRuns(parsed, startFrame, endFrame, minSeconds) {
  const minFrames = Math.round(SAMPLE_RATE * minSeconds);
  const start = Math.max(0, startFrame);
  const end = Math.min(parsed.totalFrames, endFrame);
  const runs = [];
  let silenceStart = -1;
  for (let frame = start; frame < end; frame += 1) {
    if (isSilent(parsed, frame)) {
      if (silenceStart < 0) silenceStart = frame;
    } else if (silenceStart >= 0) {
      if (frame - silenceStart >= minFrames) runs.push([silenceStart, frame]);
      silenceStart = -1;
    }
  }
  if (silenceStart >= 0 && end - silenceStart >= minFrames) runs.push([silenceStart, end]);
  return runs;
}

function summarizeRange([start, end]) {
  return {
    start,
    end,
    frames: end - start,
    seconds: Number(((end - start) / SAMPLE_RATE).toFixed(6)),
    startSeconds: Number((start / SAMPLE_RATE).toFixed(6)),
    endSeconds: Number((end / SAMPLE_RATE).toFixed(6)),
  };
}

async function fetchSource(id) {
  const number = String(id).padStart(2, "0");
  const url = `${sourceRoot}/No${number}.wav?diagnose=${Date.now()}-${Math.random()}`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.arrayBuffer();
}

if (outputDir) await mkdir(outputDir, { recursive: true });

for (const id of TARGET_IDS) {
  const number = String(id).padStart(2, "0");
  const manifestId = `set-01/part1/No${number}`;
  const item = manifestById.get(manifestId);
  if (!item) throw new Error(`Manifest entry missing: ${manifestId}`);
  const source = await fetchSource(id);
  if (sha256(source) !== item.outputSha256 || source.byteLength !== item.outputBytes) {
    throw new Error(`${manifestId}: immutable baseline mismatch`);
  }

  const fixed = fixGrade2ThreeSetOneSecondPausesWav(source, id);
  const parsed = parsePcmWav(fixed.buffer);
  const introDelta = fixed.introGapDeltaFrames;
  const bodyDelta = fixed.bodyQuestionGapDeltaFrames;
  const firstQuestionStart = fixed.bodyQuestionGapStartFrame + introDelta + fixed.targetBodyQuestionGapFrames;
  const firstQuestionEnd = fixed.questionGapStartFrame + introDelta + bodyDelta;
  const firstQuestionTextStart =
    fixed.questionGapStartFrame + introDelta + bodyDelta + fixed.targetQuestionGapFrames;

  if (outputDir) {
    await writeFile(path.join(outputDir, `No${number}-normal1s.wav`), Buffer.from(fixed.buffer));
  }

  console.log(JSON.stringify({
    id: manifestId,
    totalFrames: parsed.totalFrames,
    totalSeconds: Number((parsed.totalFrames / SAMPLE_RATE).toFixed(6)),
    firstQuestionStart,
    firstQuestionEnd,
    firstQuestionTextStart,
    tailFrames: parsed.totalFrames - firstQuestionTextStart,
    tailSeconds: Number(((parsed.totalFrames - firstQuestionTextStart) / SAMPLE_RATE).toFixed(6)),
    silenceRuns100ms: findSilenceRuns(parsed, firstQuestionTextStart, parsed.totalFrames, 0.10).map(summarizeRange),
    outputFile: outputDir ? path.join(outputDir, `No${number}-normal1s.wav`) : null,
  }));
}

console.log(`DUPLICATE_DIAGNOSTIC_READY count=${TARGET_IDS.length} outputDir=${outputDir || "none"}`);
