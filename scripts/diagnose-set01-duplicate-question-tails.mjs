import fs from "node:fs";
import { createHash } from "node:crypto";
import { GRADE2_LISTENING_SOURCE_RELEASE } from "../listening-audio-fix.js";
import { fixGrade2ThreeSetOneSecondPausesWav } from "../grade2-listening-three-set-audio-fix.js";

const TARGET_IDS = Object.freeze([6, 7, 8, 10, 12, 14]);
const SAMPLE_RATE = 24000;
const QUESTION_TEXT_SIGNATURE_FRAMES = Math.round(SAMPLE_RATE * 1.5);
const MIN_FIRST_QUESTION_TEXT_FRAMES = Math.round(SAMPLE_RATE * 1.2);
const MAX_INTER_QUESTION_GAP_FRAMES = Math.round(SAMPLE_RATE * 2.0);
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
    format,
    dataOffset,
    dataSize,
    totalFrames: dataSize / format.blockAlign,
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

function isMostlySilent(parsed, startFrame, endFrame) {
  if (endFrame <= startFrame) return false;
  let silent = 0;
  let count = 0;
  for (let frame = startFrame; frame < endFrame; frame += 1) {
    const value = Math.abs(parsed.pcm.readInt16LE(frame * 2));
    if (value <= SILENCE_THRESHOLD) silent += 1;
    count += 1;
  }
  return count > 0 && silent / count >= 0.985;
}

function lastNonSilentFrame(parsed) {
  for (let frame = parsed.totalFrames - 1; frame >= 0; frame -= 1) {
    if (Math.abs(parsed.pcm.readInt16LE(frame * 2)) > SILENCE_THRESHOLD) return frame;
  }
  return -1;
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

for (const id of TARGET_IDS) {
  const manifestId = `set-01/part1/No${String(id).padStart(2, "0")}`;
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

  const questionWord = frameBytes(parsed, firstQuestionStart, firstQuestionEnd);
  if (questionWord.length < 4000) throw new Error(`${manifestId}: Question word signature unexpectedly short`);
  const secondQuestionMatches = findAlignedOccurrences(
    parsed.pcm,
    questionWord,
    (firstQuestionTextStart + MIN_FIRST_QUESTION_TEXT_FRAMES) * 2,
  );
  if (secondQuestionMatches.length !== 1) {
    throw new Error(`${manifestId}: expected exactly one exact duplicate Question-word match, found ${secondQuestionMatches.length}: ${secondQuestionMatches.join(",")}`);
  }
  const secondQuestionStart = secondQuestionMatches[0];
  if (secondQuestionStart <= firstQuestionTextStart + MIN_FIRST_QUESTION_TEXT_FRAMES) {
    throw new Error(`${manifestId}: duplicate Question begins before a complete first question text can exist`);
  }

  const signatureEnd = firstQuestionTextStart + QUESTION_TEXT_SIGNATURE_FRAMES;
  if (signatureEnd >= secondQuestionStart) {
    throw new Error(`${manifestId}: first question text is too short for a 1.5s duplicate signature`);
  }
  const questionTextSignature = frameBytes(parsed, firstQuestionTextStart, signatureEnd);
  const secondQuestionEnd = secondQuestionStart + (firstQuestionEnd - firstQuestionStart);
  const secondTextMatches = findAlignedOccurrences(
    parsed.pcm,
    questionTextSignature,
    secondQuestionEnd * 2,
  ).filter((frame) => frame - secondQuestionEnd <= MAX_INTER_QUESTION_GAP_FRAMES);
  if (secondTextMatches.length !== 1) {
    throw new Error(`${manifestId}: expected one matching duplicate question-text signature after second Question, found ${secondTextMatches.length}: ${secondTextMatches.join(",")}`);
  }
  const secondQuestionTextStart = secondTextMatches[0];
  if (!isMostlySilent(parsed, secondQuestionEnd, secondQuestionTextStart)) {
    throw new Error(`${manifestId}: gap between duplicate Question and duplicate text is not verified silence`);
  }

  const finalNonSilent = lastNonSilentFrame(parsed);
  if (finalNonSilent < secondQuestionTextStart) {
    throw new Error(`${manifestId}: no duplicate question text after second Question`);
  }
  const duplicateTextSpeechFrames = finalNonSilent + 1 - secondQuestionTextStart;
  const firstTextComparisonEnd = firstQuestionTextStart + duplicateTextSpeechFrames;
  if (firstTextComparisonEnd > secondQuestionStart) {
    throw new Error(`${manifestId}: duplicate text length would overlap the second Question in the first sequence`);
  }
  const firstTextBytes = frameBytes(parsed, firstQuestionTextStart, firstTextComparisonEnd);
  const secondTextBytes = frameBytes(parsed, secondQuestionTextStart, finalNonSilent + 1);
  if (!firstTextBytes.equals(secondTextBytes)) {
    throw new Error(`${manifestId}: complete duplicate question-text speech is not byte-identical`);
  }

  const preservedPrefix = frameBytes(parsed, 0, secondQuestionStart);
  if (preservedPrefix.length !== secondQuestionStart * 2) {
    throw new Error(`${manifestId}: internal prefix length mismatch`);
  }

  console.log(JSON.stringify({
    id: manifestId,
    totalFrames: parsed.totalFrames,
    firstQuestionStart,
    firstQuestionEnd,
    firstQuestionTextStart,
    secondQuestionStart,
    secondQuestionEnd,
    secondQuestionTextStart,
    finalNonSilentFrame: finalNonSilent,
    duplicateTextSpeechFrames,
    duplicateTextSeconds: Number((duplicateTextSpeechFrames / SAMPLE_RATE).toFixed(6)),
    trimFrame: secondQuestionStart,
    removedFrames: parsed.totalFrames - secondQuestionStart,
    proof: "exact Question-word match + exact complete duplicated question-text speech + verified intervening silence",
  }));
}

console.log(`DUPLICATE_DIAGNOSTIC_OK count=${TARGET_IDS.length}`);
