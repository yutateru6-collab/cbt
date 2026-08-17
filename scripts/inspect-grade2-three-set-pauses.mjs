import fs from "node:fs";
import { createHash } from "node:crypto";

const SOURCE_RELEASE = "20260815-grade2-listening-pauses-v2";
const SOURCE_ROOT = `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${SOURCE_RELEASE}`;
const MANIFEST_PATH = "audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json";
const SET_KEYS = ["set-01", "set-02", "set-03"];
const SILENCE_THRESHOLD = 350;
const MIN_REPORTED_SILENCE_SECONDS = 0.08;
const MIN_INTRO_CANDIDATE_SECONDS = 0.25;
const INTRO_START_MIN_SECONDS = 0.35;
const INTRO_START_MAX_SECONDS = 3.5;
const INTRO_END_MAX_SECONDS = 6.0;
const VOICE_WINDOW_SECONDS = 0.5;
const SCAN_SECONDS = 8;

function readFourCc(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

function parsePcmWav(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 44 || readFourCc(view, 0) !== "RIFF" || readFourCc(view, 8) !== "WAVE") {
    throw new Error("Unsupported WAV container");
  }

  let offset = 12;
  let format = null;
  let data = null;
  while (offset + 8 <= buffer.byteLength) {
    const id = readFourCc(view, offset);
    const size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    const end = start + size;
    if (end > buffer.byteLength) throw new Error(`Invalid WAV chunk: ${id}`);
    if (id === "fmt ") {
      format = {
        audioFormat: view.getUint16(start, true),
        channels: view.getUint16(start + 2, true),
        sampleRate: view.getUint32(start + 4, true),
        blockAlign: view.getUint16(start + 12, true),
        bitsPerSample: view.getUint16(start + 14, true),
      };
    } else if (id === "data") {
      data = { dataOffset: start, dataSize: size };
      break;
    }
    offset = end + (size % 2);
  }

  if (!format || !data) throw new Error("WAV fmt/data chunk not found");
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16 || format.channels !== 1 || format.blockAlign !== 2) {
    throw new Error("Expected 16-bit mono PCM WAV");
  }
  return { view, format, data };
}

function isSilentSample(parsed, frame) {
  return Math.abs(
    parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true),
  ) <= SILENCE_THRESHOLD;
}

function hasVoice(parsed, startFrame, endFrame) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const start = Math.max(0, Math.min(totalFrames, startFrame));
  const end = Math.max(start, Math.min(totalFrames, endFrame));
  for (let frame = start; frame < end; frame += 1) {
    if (!isSilentSample(parsed, frame)) return true;
  }
  return false;
}

function assertSilentRange(parsed, range, label) {
  const [start, end] = range;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start >= end) {
    throw new Error(`${label}: invalid range ${JSON.stringify(range)}`);
  }
  for (let frame = start; frame < end; frame += 1) {
    if (!isSilentSample(parsed, frame)) {
      throw new Error(`${label}: expected silence at frame ${frame}`);
    }
  }
}

function findSilenceRuns(parsed) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const endFrame = Math.min(totalFrames, Math.round(parsed.format.sampleRate * SCAN_SECONDS));
  const minimumFrames = Math.round(parsed.format.sampleRate * MIN_REPORTED_SILENCE_SECONDS);
  const runs = [];
  let start = -1;

  for (let frame = 0; frame < endFrame; frame += 1) {
    if (isSilentSample(parsed, frame)) {
      if (start < 0) start = frame;
    } else if (start >= 0) {
      if (frame - start >= minimumFrames) runs.push([start, frame]);
      start = -1;
    }
  }
  if (start >= 0 && endFrame - start >= minimumFrames) runs.push([start, endFrame]);
  return runs;
}

function introCandidates(parsed, runs) {
  const rate = parsed.format.sampleRate;
  const minFrames = Math.round(rate * MIN_INTRO_CANDIDATE_SECONDS);
  const startMin = Math.round(rate * INTRO_START_MIN_SECONDS);
  const startMax = Math.round(rate * INTRO_START_MAX_SECONDS);
  const endMax = Math.round(rate * INTRO_END_MAX_SECONDS);
  const voiceWindow = Math.round(rate * VOICE_WINDOW_SECONDS);

  return runs.filter(([start, end]) => {
    if (end - start < minFrames) return false;
    if (start < startMin || start > startMax || end > endMax) return false;
    return hasVoice(parsed, start - voiceWindow, start) && hasVoice(parsed, end, end + voiceWindow);
  });
}

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

function formatRun(rate, [start, end]) {
  return {
    start,
    end,
    frames: end - start,
    seconds: Number(((end - start) / rate).toFixed(6)),
    startSeconds: Number((start / rate).toFixed(6)),
    endSeconds: Number((end / rate).toFixed(6)),
  };
}

async function fetchArrayBuffer(url) {
  const response = await fetch(`${url}?inspect=${Date.now()}-${Math.random()}`, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.arrayBuffer();
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const byId = new Map(manifest.items.map((item) => [item.id, item]));
const audit = [];

for (const setKey of SET_KEYS) {
  for (let id = 1; id <= 30; id += 1) {
    const part = id <= 15 ? "part1" : "part2";
    const number = String(id).padStart(2, "0");
    const manifestId = `${setKey}/${part}/No${number}`;
    const item = byId.get(manifestId);
    if (!item) throw new Error(`Normalization manifest entry missing: ${manifestId}`);
    if (item.status !== "normalized" || item.sampleRate !== 24000 || item.channels !== 1) {
      throw new Error(`Unexpected manifest metadata for ${manifestId}`);
    }

    const bodyQuestionGap = item.normalizedBoundaries?.bodyQuestionGap;
    const questionTextGap = item.normalizedBoundaries?.questionTextGap;
    if (!Array.isArray(bodyQuestionGap) || !Array.isArray(questionTextGap)) {
      throw new Error(`Normalized pause boundaries missing for ${manifestId}`);
    }
    if (bodyQuestionGap[1] - bodyQuestionGap[0] !== 19200) {
      throw new Error(`${manifestId}: body->Question is not normalized to 19,200 frames`);
    }
    if (questionTextGap[1] - questionTextGap[0] !== 14400) {
      throw new Error(`${manifestId}: Question->text is not normalized to 14,400 frames`);
    }

    const sourceUrl = `${SOURCE_ROOT}/${setKey}/listening/${part}/No${number}.wav`;
    const buffer = await fetchArrayBuffer(sourceUrl);
    const parsed = parsePcmWav(buffer);
    if (parsed.format.sampleRate !== 24000) throw new Error(`${manifestId}: WAV sample rate is ${parsed.format.sampleRate}`);
    const actualSha = sha256(buffer);
    if (actualSha !== item.outputSha256) {
      throw new Error(`${manifestId}: source SHA mismatch ${actualSha} != ${item.outputSha256}`);
    }
    if (buffer.byteLength !== item.outputBytes) {
      throw new Error(`${manifestId}: source byte count mismatch ${buffer.byteLength} != ${item.outputBytes}`);
    }

    assertSilentRange(parsed, bodyQuestionGap, `${manifestId} body->Question`);
    assertSilentRange(parsed, questionTextGap, `${manifestId} Question->text`);

    const runs = findSilenceRuns(parsed);
    const candidates = introCandidates(parsed, runs);
    const row = {
      id: manifestId,
      sha256: actualSha,
      bytes: buffer.byteLength,
      bodyQuestionGap: formatRun(parsed.format.sampleRate, bodyQuestionGap),
      questionTextGap: formatRun(parsed.format.sampleRate, questionTextGap),
      introCandidates: candidates.map((range) => formatRun(parsed.format.sampleRate, range)),
      earlySilenceRuns: runs
        .filter(([start]) => start <= parsed.format.sampleRate * 4)
        .map((range) => formatRun(parsed.format.sampleRate, range)),
    };
    audit.push(row);
    console.log(JSON.stringify(row));
  }
}

const ambiguous = audit.filter((row) => row.introCandidates.length !== 1);
console.log(`AUDIT_SUMMARY total=${audit.length} uniqueIntro=${audit.length - ambiguous.length} ambiguous=${ambiguous.length}`);
if (ambiguous.length) {
  console.error("AMBIGUOUS_INTRO_IDS", ambiguous.map((row) => row.id).join(","));
  process.exitCode = 2;
}
