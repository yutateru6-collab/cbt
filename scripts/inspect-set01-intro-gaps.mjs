import { createHash } from "node:crypto";

const SOURCE_RELEASE = "20260815-grade2-listening-pauses-v2";
const SOURCE_BASE = `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${SOURCE_RELEASE}/set-01/listening/part1`;
const SILENCE_THRESHOLD = 350;
const MIN_SILENCE_SECONDS = 0.08;
const MAX_SCAN_SECONDS = 10;

function readFourCc(view, offset) {
  return String.fromCharCode(view.getUint8(offset), view.getUint8(offset + 1), view.getUint8(offset + 2), view.getUint8(offset + 3));
}

function parsePcmWav(buffer) {
  const view = new DataView(buffer);
  if (buffer.byteLength < 44 || readFourCc(view, 0) !== "RIFF" || readFourCc(view, 8) !== "WAVE") throw new Error("Unsupported WAV container");
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
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16 || format.channels !== 1 || format.blockAlign !== 2) throw new Error("Expected 16-bit mono PCM WAV");
  return { view, format, data };
}

function findSilenceRuns(buffer) {
  const parsed = parsePcmWav(buffer);
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const maxFrame = Math.min(totalFrames, Math.round(parsed.format.sampleRate * MAX_SCAN_SECONDS));
  const minimumFrames = Math.round(parsed.format.sampleRate * MIN_SILENCE_SECONDS);
  const runs = [];
  let start = -1;
  for (let frame = 0; frame < maxFrame; frame += 1) {
    const sample = Math.abs(parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true));
    const silent = sample <= SILENCE_THRESHOLD;
    if (silent) {
      if (start < 0) start = frame;
    } else if (start >= 0) {
      if (frame - start >= minimumFrames) runs.push([start, frame]);
      start = -1;
    }
  }
  if (start >= 0 && maxFrame - start >= minimumFrames) runs.push([start, maxFrame]);
  return { parsed, runs };
}

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

for (let id = 1; id <= 5; id += 1) {
  const number = String(id).padStart(2, "0");
  const url = `${SOURCE_BASE}/No${number}.wav?inspect=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for No.${number}`);
  const buffer = await response.arrayBuffer();
  const { parsed, runs } = findSilenceRuns(buffer);
  console.log(JSON.stringify({
    id,
    sampleRate: parsed.format.sampleRate,
    bytes: buffer.byteLength,
    sha256: sha256(buffer),
    firstTenSecondSilenceRuns: runs.map(([start, end]) => ({
      start,
      end,
      frames: end - start,
      seconds: Number(((end - start) / parsed.format.sampleRate).toFixed(6)),
    })),
  }));
}
