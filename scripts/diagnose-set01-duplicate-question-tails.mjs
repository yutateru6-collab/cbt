import fs from "node:fs";
import { createHash } from "node:crypto";
import { GRADE2_LISTENING_SOURCE_RELEASE } from "../listening-audio-fix.js";
import { fixGrade2ThreeSetOneSecondPausesWav } from "../grade2-listening-three-set-audio-fix.js";

const TARGET_IDS = Object.freeze([6, 7, 8, 10, 12, 14]);
const SAMPLE_RATE = 24000;
const QUESTION_TEXT_SIGNATURE_FRAMES = Math.round(SAMPLE_RATE * 1.0);
const MIN_FIRST_QUESTION_TEXT_FRAMES = Math.round(SAMPLE_RATE * 1.2);
const SILENCE_THRESHOLD = 350;
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
    bytes,
    dataOffset,
    dataSize,
    totalFrames: dataSize / 2,
    pcm: bytes.subarray(dataOffset, dataOffset + dataSize),
  };
}

function frameBytes(parsed, startFrame, endFrame) {
  return parsed.pcm.subarray(startFrame * 2, endFrame * 2);
}

function findAlignedOccurrences(haystack, needle, fromByte) {
  const matches = [];
  let cursor = Math.max(0, fromByte);
  while (cursor <= haystack.length - needle.length) {
    const found = haystack.indexOf(needle, cursor);
    if (found < 0) break;
    if (found % 2 === 0) matches.push(found / 2);
    cursor = found + 2;
  }
  return matches;
}

function commonPrefixFrames(parsed, firstStart, secondStart) {
  const max = Math.min(secondStart - firstStart, parsed.totalFrames - secondStart);
  let frames = 0;
  while (frames < max) {
    const a = parsed.pcm.readInt16LE((firstStart + frames) * 2);
    const b = parsed.pcm.readInt16LE((secondStart + frames) * 2);
    if (a !== b) break;
    frames += 1;
  }
  return frames;
}

function hasVoice(parsed, startFrame, endFrame) {
  for (let frame = Math.max(0, startFrame); frame < Math.min(parsed.totalFrames, endFrame); frame += 1) {
    if (Math.abs(parsed.pcm.readInt16LE(frame * 2)) > SILENCE_THRESHOLD) return true;
  }
  return false;
}

function findSilenceRuns(parsed, startFrame, endFrame, minFrames = Math.round(SAMPLE_RATE * 0.08)) {
  const runs = [];
  let start = -1;
  for (let frame = Math.max(0, startFrame); frame < Math.min(parsed.totalFrames, endFrame); frame += 1) {
    const silent = Math.abs(parsed.pcm.readInt16LE(frame * 2)) <= SILENCE_THRESHOLD;
    if (silent) {
      if (start < 0) start = frame;
    } else if (start >= 0) {
      if (frame - start >= minFrames) runs.push([start, frame]);
      start = -1;
    }
  }
  if (start >= 0 && endFrame - start >= minFrames) runs.push([start, Math.min(parsed.totalFrames, endFrame)]);
  return runs;
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

const failures = [];
for (const id of TARGET_IDS) {
  const manifestId = `set-01/part1/No${String(id).padStart(2, "0")}`;
  try {
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

    if (!(firstQuestionStart < firstQuestionEnd && firstQuestionEnd < firstQuestionTextStart)) {
      throw new Error(`${manifestId}: invalid first Question structure`);
    }

    const questionTextSignature = frameBytes(
      parsed,
      firstQuestionTextStart,
      firstQuestionTextStart + QUESTION_TEXT_SIGNATURE_FRAMES,
    );
    const secondTextMatches = findAlignedOccurrences(
      parsed.pcm,
      questionTextSignature,
      (firstQuestionTextStart + MIN_FIRST_QUESTION_TEXT_FRAMES) * 2,
    );
    if (secondTextMatches.length !== 1) {
      throw new Error(`${manifestId}: expected exactly one exact duplicate question-text match, found ${secondTextMatches.length}: ${secondTextMatches.join(",")}`);
    }
    const secondQuestionTextStart = secondTextMatches[0];
    const duplicateCommonPrefixFrames = commonPrefixFrames(parsed, firstQuestionTextStart, secondQuestionTextStart);
    if (duplicateCommonPrefixFrames < QUESTION_TEXT_SIGNATURE_FRAMES) {
      throw new Error(`${manifestId}: duplicated question-text common prefix is shorter than proof signature`);
    }

    const questionWord = frameBytes(parsed, firstQuestionStart, firstQuestionEnd);
    const exactQuestionWordMatches = findAlignedOccurrences(
      parsed.pcm,
      questionWord,
      (firstQuestionTextStart + MIN_FIRST_QUESTION_TEXT_FRAMES) * 2,
    );

    const firstDuplicateEnd = firstQuestionTextStart + duplicateCommonPrefixFrames;
    const gapRuns = findSilenceRuns(parsed, firstDuplicateEnd, secondQuestionTextStart);
    const voiceBetweenCopies = hasVoice(parsed, firstDuplicateEnd, secondQuestionTextStart);

    console.log(JSON.stringify({
      id: manifestId,
      totalFrames: parsed.totalFrames,
      firstQuestionStart,
      firstQuestionEnd,
      firstQuestionTextStart,
      secondQuestionTextStart,
      duplicateCommonPrefixFrames,
      duplicateCommonPrefixSeconds: Number((duplicateCommonPrefixFrames / SAMPLE_RATE).toFixed(6)),
      exactQuestionWordMatches,
      voiceBetweenCopies,
      gapRuns: gapRuns.map(([start, end]) => ({
        start,
        end,
        frames: end - start,
        seconds: Number(((end - start) / SAMPLE_RATE).toFixed(6)),
      })),
      candidateTrimAtSecondText: secondQuestionTextStart,
      proof: "exact 1.0s question-text PCM signature repeated once; common prefix expanded exactly",
    }));
  } catch (error) {
    failures.push(`${manifestId}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`DUPLICATE_DIAGNOSTIC_FAILURE ${failure}`);
  process.exitCode = 2;
} else {
  console.log(`DUPLICATE_DIAGNOSTIC_OK count=${TARGET_IDS.length}`);
}
