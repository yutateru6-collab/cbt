export const GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE =
  "20260820-set01-listening-no05-duplicate-question-fix-v1";

const SAMPLE_RATE = 24000;
const PCM_SILENCE_THRESHOLD = 350;
const INPUT_FRAMES = 750883;
const TRIM_FRAME = 658757;
const BODY_QUESTION_GAP_FRAMES = 24000;
const QUESTION_CUE_FRAMES = 13032;
const QUESTION_TEXT_GAP_FRAMES = 19200;
const SECOND_QUESTION_FRAMES = 35894;
const PROOF_FRAMES = Math.round(SAMPLE_RATE * 0.1);

// This boundary is derived from the immutable Set 01 No.5 master and the
// already-approved 1s / 1s / 0.8s transform:
//   normalized body->Question start 649753
// + verified intro expansion (24000 - 14996) = 658757.
// The exact remainder is 1.0s silence + spoken "Question" + 0.8s silence +
// the redundant second question sentence. We keep the byte-identical prefix
// through the first complete question sentence and remove only that rear copy.
if (
  INPUT_FRAMES - TRIM_FRAME !==
  BODY_QUESTION_GAP_FRAMES + QUESTION_CUE_FRAMES + QUESTION_TEXT_GAP_FRAMES + SECOND_QUESTION_FRAMES
) {
  throw new Error("Set 01 No.5 duplicate-tail constants are inconsistent");
}

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
    const chunkId = readFourCc(view, offset);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;
    const chunkEnd = chunkDataOffset + chunkSize;
    if (chunkEnd > buffer.byteLength) throw new Error(`Invalid WAV chunk: ${chunkId}`);

    if (chunkId === "fmt ") {
      if (chunkSize < 16) throw new Error("Invalid WAV fmt chunk");
      format = {
        audioFormat: view.getUint16(chunkDataOffset, true),
        channels: view.getUint16(chunkDataOffset + 2, true),
        sampleRate: view.getUint32(chunkDataOffset + 4, true),
        blockAlign: view.getUint16(chunkDataOffset + 12, true),
        bitsPerSample: view.getUint16(chunkDataOffset + 14, true),
      };
    } else if (chunkId === "data") {
      data = {
        sizeOffset: offset + 4,
        dataOffset: chunkDataOffset,
        dataSize: chunkSize,
      };
      break;
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!format || !data) throw new Error("WAV fmt/data chunk not found");
  if (
    format.audioFormat !== 1 ||
    format.channels !== 1 ||
    format.sampleRate !== SAMPLE_RATE ||
    format.bitsPerSample !== 16 ||
    format.blockAlign !== 2
  ) {
    throw new Error(`Unexpected Set 01 No.5 WAV format: ${JSON.stringify(format)}`);
  }
  if (data.dataOffset + data.dataSize > buffer.byteLength) throw new Error("Invalid WAV data size");

  return {
    view,
    format,
    data,
    totalFrames: Math.floor(data.dataSize / format.blockAlign),
  };
}

function isSilent(parsed, frame) {
  return Math.abs(
    parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true),
  ) <= PCM_SILENCE_THRESHOLD;
}

function hasVoice(parsed, startFrame, endFrame) {
  const start = Math.max(0, startFrame);
  const end = Math.min(parsed.totalFrames, endFrame);
  for (let frame = start; frame < end; frame += 1) {
    if (!isSilent(parsed, frame)) return true;
  }
  return false;
}

function assertSilentRange(parsed, startFrame, endFrame, label) {
  if (startFrame < 0 || endFrame > parsed.totalFrames || startFrame >= endFrame) {
    throw new Error(`${label} is outside the WAV`);
  }
  for (let frame = startFrame; frame < endFrame; frame += 1) {
    if (!isSilent(parsed, frame)) {
      throw new Error(`${label} is not silent at frame ${frame}`);
    }
  }
}

function assertNo05Structure(parsed) {
  if (parsed.totalFrames !== INPUT_FRAMES) {
    throw new Error(`Unexpected No.5 source frame count: ${parsed.totalFrames}/${INPUT_FRAMES}`);
  }

  if (!hasVoice(parsed, TRIM_FRAME - PROOF_FRAMES, TRIM_FRAME)) {
    throw new Error("No.5 trim boundary is not immediately after the first question speech");
  }

  const bodyGapEnd = TRIM_FRAME + BODY_QUESTION_GAP_FRAMES;
  const questionCueEnd = bodyGapEnd + QUESTION_CUE_FRAMES;
  const questionGapEnd = questionCueEnd + QUESTION_TEXT_GAP_FRAMES;

  assertSilentRange(parsed, TRIM_FRAME, bodyGapEnd, "No.5 rear body-to-Question gap");
  if (!hasVoice(parsed, bodyGapEnd, questionCueEnd)) {
    throw new Error("No.5 rear spoken Question cue is missing");
  }
  assertSilentRange(parsed, questionCueEnd, questionGapEnd, "No.5 rear Question-to-text gap");
  if (!hasVoice(parsed, questionGapEnd, parsed.totalFrames)) {
    throw new Error("No.5 redundant rear question sentence is missing");
  }
}

function truncateAtFrame(buffer, parsed, trimFrame) {
  const dataBytes = trimFrame * parsed.format.blockAlign;
  const nextLength = parsed.data.dataOffset + dataBytes;
  const output = new Uint8Array(nextLength);
  output.set(new Uint8Array(buffer, 0, parsed.data.dataOffset), 0);
  output.set(
    new Uint8Array(buffer, parsed.data.dataOffset, dataBytes),
    parsed.data.dataOffset,
  );
  const view = new DataView(output.buffer);
  view.setUint32(4, nextLength - 8, true);
  view.setUint32(parsed.data.sizeOffset, dataBytes, true);
  return output.buffer;
}

export function fixGrade2Set01No05DuplicateFromOneSecondWav(buffer, questionId) {
  if (Number(questionId) !== 5) {
    throw new Error(`Unsupported Set 01 No.5-only duplicate fix question: ${questionId}`);
  }

  const parsed = parsePcmWav(buffer);
  assertNo05Structure(parsed);
  const removedFrames = parsed.totalFrames - TRIM_FRAME;

  return {
    buffer: truncateAtFrame(buffer, parsed, TRIM_FRAME),
    changed: true,
    fix: "remove-set01-no05-rear-duplicate-question-only",
    trimFrame: TRIM_FRAME,
    sourceFrames: parsed.totalFrames,
    removedFrames,
  };
}
