export const GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE =
  "20260817-set01-listening-duplicate-question-fix-v2";

const SAMPLE_RATE = 24000;
const PCM_SILENCE_THRESHOLD = 350;
const BOUNDARY_PROOF_FRAMES = Math.round(SAMPLE_RATE * 0.1);

// Verified against the accepted 1s / 1s / 0.8s Set 01 WAVs.
// Every boundary starts verified silence immediately after the first complete
// wanted Question + question sentence. No.6 stays at 683562: v1 happened to
// use the correct boundary for No.6; the other v1 cuts were wrong.
const TRIM_FRAME = Object.freeze({
  6: 683562,
  7: 702988,
  8: 748632,
  10: 769265,
  12: 741045,
  14: 721151,
});

const INPUT_FRAMES = Object.freeze({
  6: 791087,
  7: 884055,
  8: 864858,
  10: 873824,
  12: 848780,
  14: 827740,
});

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
    const chunkId = readFourCc(view, offset);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;
    const chunkEnd = chunkDataOffset + chunkSize;
    if (chunkEnd > buffer.byteLength) throw new Error(`Invalid WAV chunk: ${chunkId}`);
    if (chunkId === "fmt ") {
      format = {
        audioFormat: view.getUint16(chunkDataOffset, true),
        channels: view.getUint16(chunkDataOffset + 2, true),
        sampleRate: view.getUint32(chunkDataOffset + 4, true),
        blockAlign: view.getUint16(chunkDataOffset + 12, true),
        bitsPerSample: view.getUint16(chunkDataOffset + 14, true),
      };
    } else if (chunkId === "data") {
      data = { sizeOffset: offset + 4, dataOffset: chunkDataOffset, dataSize: chunkSize };
      break;
    }
    offset = chunkEnd + (chunkSize % 2);
  }
  if (!format || !data) throw new Error("WAV fmt/data chunk not found");
  if (format.audioFormat !== 1 || format.channels !== 1 || format.sampleRate !== SAMPLE_RATE || format.bitsPerSample !== 16 || format.blockAlign !== 2) {
    throw new Error(`Unexpected Set 01 V2 WAV format: ${JSON.stringify(format)}`);
  }
  return { view, format, data, totalFrames: Math.floor(data.dataSize / format.blockAlign) };
}

function isSilent(parsed, frame) {
  return Math.abs(parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true)) <= PCM_SILENCE_THRESHOLD;
}

function assertVerifiedBoundary(parsed, trimFrame, id) {
  if (trimFrame < BOUNDARY_PROOF_FRAMES || trimFrame + BOUNDARY_PROOF_FRAMES > parsed.totalFrames) throw new Error(`No.${id} V2 boundary is outside the verified proof window`);
  let voiceBefore = false;
  for (let frame = trimFrame - BOUNDARY_PROOF_FRAMES; frame < trimFrame; frame += 1) {
    if (!isSilent(parsed, frame)) { voiceBefore = true; break; }
  }
  if (!voiceBefore) throw new Error(`No.${id} V2 boundary is not immediately after the first wanted question speech`);
  for (let frame = trimFrame; frame < trimFrame + BOUNDARY_PROOF_FRAMES; frame += 1) {
    if (!isSilent(parsed, frame)) throw new Error(`No.${id} V2 boundary is not followed by verified duplicate-tail silence at frame ${frame}`);
  }
}

function truncateAtFrame(buffer, parsed, trimFrame) {
  const dataBytes = trimFrame * parsed.format.blockAlign;
  const nextLength = parsed.data.dataOffset + dataBytes;
  const output = new Uint8Array(nextLength);
  output.set(new Uint8Array(buffer, 0, parsed.data.dataOffset), 0);
  output.set(new Uint8Array(buffer, parsed.data.dataOffset, dataBytes), parsed.data.dataOffset);
  const view = new DataView(output.buffer);
  view.setUint32(4, nextLength - 8, true);
  view.setUint32(parsed.data.sizeOffset, dataBytes, true);
  return output.buffer;
}

export function fixGrade2Set01DuplicateQuestionV2FromOneSecondWav(buffer, questionId) {
  const id = Number(questionId);
  const trimFrame = TRIM_FRAME[id];
  const expectedInputFrames = INPUT_FRAMES[id];
  if (!Number.isInteger(trimFrame) || !Number.isInteger(expectedInputFrames)) throw new Error(`Unsupported Set 01 duplicate-question V2 question: ${questionId}`);
  const parsed = parsePcmWav(buffer);
  if (parsed.totalFrames !== expectedInputFrames) throw new Error(`Unexpected V2 source frame count for No.${id}: ${parsed.totalFrames}/${expectedInputFrames}`);
  assertVerifiedBoundary(parsed, trimFrame, id);
  const removedFrames = parsed.totalFrames - trimFrame;
  if (removedFrames < SAMPLE_RATE) throw new Error(`V2 duplicate tail is unexpectedly short for No.${id}: ${removedFrames} frames`);
  return {
    buffer: truncateAtFrame(buffer, parsed, trimFrame),
    changed: true,
    fix: "remove-verified-rear-duplicate-question-tail-v2",
    trimFrame,
    sourceFrames: parsed.totalFrames,
    removedFrames,
  };
}
