export const GRADE2_LISTENING_SOURCE_RELEASE = "20260815-grade2-listening-pauses-v2";
export const GRADE2_LISTENING_FIX_RELEASE = "20260817-set01-listening-q5-q9-fix-v1";

const PCM_SILENCE_THRESHOLD = 350;
const INTRO_TARGET_SILENCE_SECONDS = 0.8;
const INTRO_LONG_SILENCE_SECONDS = 1.4;
const INTRO_SEARCH_SECONDS = 8;

// Verified frame positions from the active 24 kHz mono PCM masters.
// At each boundary, the first (wanted) question has finished. Everything
// after it is the redundant second question sequence reported for No.5-No.8.
const SET01_PART1_FIRST_QUESTION_END_FRAME = Object.freeze({
  5: 649753,
  6: 674704,
  7: 585028,
  8: 634271,
});

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
        chunkOffset: offset,
        sizeOffset: offset + 4,
        dataOffset: chunkDataOffset,
        dataSize: chunkSize,
      };
      break;
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!format || !data) throw new Error("WAV fmt/data chunk not found");
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16 || format.channels !== 1 || format.blockAlign !== 2) {
    throw new Error("Expected 16-bit mono PCM WAV");
  }
  if (data.dataOffset + data.dataSize > buffer.byteLength) throw new Error("Invalid WAV data size");

  return { view, format, data };
}

function rewriteWavData(buffer, replacementData) {
  const { data } = parsePcmWav(buffer);
  const nextLength = data.dataOffset + replacementData.byteLength;
  const output = new Uint8Array(nextLength);
  output.set(new Uint8Array(buffer, 0, data.dataOffset), 0);
  output.set(replacementData, data.dataOffset);
  const view = new DataView(output.buffer);
  view.setUint32(4, nextLength - 8, true);
  view.setUint32(data.sizeOffset, replacementData.byteLength, true);
  return output.buffer;
}

function truncateAtFrame(buffer, endFrame) {
  const { format, data } = parsePcmWav(buffer);
  const totalFrames = Math.floor(data.dataSize / format.blockAlign);
  if (!Number.isInteger(endFrame) || endFrame <= 0 || endFrame >= totalFrames) {
    throw new Error(`Invalid listening trim frame: ${endFrame}/${totalFrames}`);
  }
  const dataBytes = endFrame * format.blockAlign;
  const truncated = new Uint8Array(buffer, data.dataOffset, dataBytes);
  return rewriteWavData(buffer, truncated);
}

function findOpeningLongSilence(buffer) {
  const { view, format, data } = parsePcmWav(buffer);
  const totalFrames = Math.floor(data.dataSize / format.blockAlign);
  const maxFrame = Math.min(totalFrames, Math.round(format.sampleRate * INTRO_SEARCH_SECONDS));
  const minSilenceFrames = Math.round(format.sampleRate * INTRO_LONG_SILENCE_SECONDS);
  let sawVoice = false;
  let silenceStart = -1;

  for (let frame = 0; frame < maxFrame; frame += 1) {
    const sample = Math.abs(view.getInt16(data.dataOffset + frame * format.blockAlign, true));
    const silent = sample <= PCM_SILENCE_THRESHOLD;
    if (!sawVoice) {
      if (!silent) sawVoice = true;
      continue;
    }
    if (silent) {
      if (silenceStart < 0) silenceStart = frame;
      continue;
    }
    if (silenceStart >= 0) {
      if (frame - silenceStart >= minSilenceFrames) return [silenceStart, frame];
      silenceStart = -1;
    }
  }
  if (silenceStart >= 0 && maxFrame - silenceStart >= minSilenceFrames) return [silenceStart, maxFrame];
  return null;
}

function shortenOpeningSilence(buffer) {
  const parsed = parsePcmWav(buffer);
  const silence = findOpeningLongSilence(buffer);
  if (!silence) return { buffer, changed: false, removedFrames: 0 };

  const [startFrame, endFrame] = silence;
  const targetFrames = Math.round(parsed.format.sampleRate * INTRO_TARGET_SILENCE_SECONDS);
  const currentFrames = endFrame - startFrame;
  if (currentFrames <= targetFrames) return { buffer, changed: false, removedFrames: 0 };

  const frameWidth = parsed.format.blockAlign;
  const beforeBytes = startFrame * frameWidth;
  const afterOffset = endFrame * frameWidth;
  const sourceData = new Uint8Array(buffer, parsed.data.dataOffset, parsed.data.dataSize);
  const replacement = new Uint8Array(beforeBytes + targetFrames * frameWidth + (sourceData.byteLength - afterOffset));
  replacement.set(sourceData.subarray(0, beforeBytes), 0);
  // The target gap remains zero-filled.
  replacement.set(sourceData.subarray(afterOffset), beforeBytes + targetFrames * frameWidth);
  return {
    buffer: rewriteWavData(buffer, replacement),
    changed: true,
    removedFrames: currentFrames - targetFrames,
  };
}

export function fixGrade2Set01ListeningWav(buffer, questionId) {
  const id = Number(questionId);
  const trimFrame = SET01_PART1_FIRST_QUESTION_END_FRAME[id];
  if (trimFrame) {
    return {
      buffer: truncateAtFrame(buffer, trimFrame),
      changed: true,
      fix: "remove-second-question",
    };
  }
  if (id === 9) {
    const fixed = shortenOpeningSilence(buffer);
    return {
      buffer: fixed.buffer,
      changed: fixed.changed,
      fix: fixed.changed ? "shorten-no9-intro-pause" : "no9-intro-pause-not-found",
      removedFrames: fixed.removedFrames,
    };
  }
  throw new Error(`Unsupported Grade 2 set-01 listening fix question: ${questionId}`);
}
