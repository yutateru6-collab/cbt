export const GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE =
  "20260817-grade2-sets01-03-listening-pauses-1s-v1";

const PCM_SILENCE_THRESHOLD = 350;
const TARGET_ONE_SECOND = 1.0;
const TARGET_QUESTION_TEXT_SECONDS = 0.8;
const NORMALIZED_BODY_QUESTION_FRAMES_24K = 19200;
const NORMALIZED_QUESTION_TEXT_FRAMES_24K = 14400;
const MIN_REPORTED_SILENCE_SECONDS = 0.08;
const MIN_STRUCTURAL_SILENCE_SECONDS = 0.15;
const MIN_INTRO_CANDIDATE_SECONDS = 0.25;
const INTRO_START_MIN_SECONDS = 0.35;
const INTRO_START_MAX_SECONDS = 1.8;
const INTRO_END_MAX_SECONDS = 6.0;
const INTRO_VOICE_WINDOW_SECONDS = 0.5;
const INTRO_SCAN_SECONDS = 8;
const MIN_QUESTION_WORD_SECONDS = 0.20;
const MAX_QUESTION_WORD_SECONDS = 1.20;
const MIN_QUESTION_TEXT_REMAINDER_SECONDS = 1.20;

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
  if (format.audioFormat !== 1 || format.bitsPerSample !== 16 || format.channels !== 1 || format.blockAlign !== 2) {
    throw new Error("Expected 16-bit mono PCM WAV");
  }
  if (format.sampleRate !== 24000) {
    throw new Error(`Expected 24 kHz Grade 2 listening master, got ${format.sampleRate}`);
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

function isSilentSample(parsed, frame) {
  return Math.abs(
    parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true),
  ) <= PCM_SILENCE_THRESHOLD;
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

function assertSilentFrameRange(parsed, startFrame, endFrame) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || startFrame >= endFrame || endFrame > totalFrames) {
    throw new Error(`Invalid silence frame range: ${startFrame}-${endFrame}/${totalFrames}`);
  }
  for (let frame = startFrame; frame < endFrame; frame += 1) {
    if (!isSilentSample(parsed, frame)) {
      throw new Error(`Expected silence at frame ${frame}`);
    }
  }
}

function replaceSilenceAtFrames(buffer, startFrame, endFrame, targetSeconds) {
  const parsed = parsePcmWav(buffer);
  assertSilentFrameRange(parsed, startFrame, endFrame);
  const targetFrames = Math.round(parsed.format.sampleRate * targetSeconds);
  const currentFrames = endFrame - startFrame;
  if (currentFrames === targetFrames) {
    return {
      buffer,
      changed: false,
      startFrame,
      originalFrames: currentFrames,
      targetFrames,
      deltaFrames: 0,
    };
  }

  const frameWidth = parsed.format.blockAlign;
  const sourceData = new Uint8Array(buffer, parsed.data.dataOffset, parsed.data.dataSize);
  const beforeBytes = startFrame * frameWidth;
  const afterOffset = endFrame * frameWidth;
  const replacement = new Uint8Array(
    beforeBytes + targetFrames * frameWidth + (sourceData.byteLength - afterOffset),
  );
  replacement.set(sourceData.subarray(0, beforeBytes), 0);
  replacement.set(sourceData.subarray(afterOffset), beforeBytes + targetFrames * frameWidth);
  return {
    buffer: rewriteWavData(buffer, replacement),
    changed: true,
    startFrame,
    originalFrames: currentFrames,
    targetFrames,
    deltaFrames: targetFrames - currentFrames,
  };
}

function findSilenceRuns(parsed, startFrame, endFrame, minimumSeconds) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const start = Math.max(0, Math.min(totalFrames, startFrame));
  const end = Math.max(start, Math.min(totalFrames, endFrame));
  const minimumFrames = Math.round(parsed.format.sampleRate * minimumSeconds);
  const runs = [];
  let silenceStart = -1;

  for (let frame = start; frame < end; frame += 1) {
    if (isSilentSample(parsed, frame)) {
      if (silenceStart < 0) silenceStart = frame;
    } else if (silenceStart >= 0) {
      if (frame - silenceStart >= minimumFrames) runs.push([silenceStart, frame]);
      silenceStart = -1;
    }
  }
  if (silenceStart >= 0 && end - silenceStart >= minimumFrames) runs.push([silenceStart, end]);
  return runs;
}

function findVerifiedIntroGap(parsed) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const scanEnd = Math.min(totalFrames, Math.round(parsed.format.sampleRate * INTRO_SCAN_SECONDS));
  const runs = findSilenceRuns(parsed, 0, scanEnd, MIN_REPORTED_SILENCE_SECONDS);
  const minFrames = Math.round(parsed.format.sampleRate * MIN_INTRO_CANDIDATE_SECONDS);
  const startMin = Math.round(parsed.format.sampleRate * INTRO_START_MIN_SECONDS);
  const startMax = Math.round(parsed.format.sampleRate * INTRO_START_MAX_SECONDS);
  const endMax = Math.round(parsed.format.sampleRate * INTRO_END_MAX_SECONDS);
  const voiceWindow = Math.round(parsed.format.sampleRate * INTRO_VOICE_WINDOW_SECONDS);

  const matches = runs.filter(([start, end]) => {
    if (end - start < minFrames) return false;
    if (start < startMin || start > startMax || end > endMax) return false;
    return hasVoice(parsed, start - voiceWindow, start) && hasVoice(parsed, end, end + voiceWindow);
  });

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one verified No.X -> body gap, found ${matches.length}`);
  }
  return matches[0];
}

function findExactNormalizedQuestionGaps(parsed) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const runs = findSilenceRuns(
    parsed,
    Math.floor(totalFrames / 2),
    totalFrames,
    MIN_STRUCTURAL_SILENCE_SECONDS,
  );
  const matches = [];

  for (let index = 0; index < runs.length - 1; index += 1) {
    const bodyQuestionGap = runs[index];
    const questionTextGap = runs[index + 1];
    const bodyFrames = bodyQuestionGap[1] - bodyQuestionGap[0];
    const questionTextFrames = questionTextGap[1] - questionTextGap[0];
    const questionWordSeconds =
      (questionTextGap[0] - bodyQuestionGap[1]) / parsed.format.sampleRate;
    const questionTextRemainderSeconds =
      (totalFrames - questionTextGap[1]) / parsed.format.sampleRate;

    if (
      bodyFrames === NORMALIZED_BODY_QUESTION_FRAMES_24K &&
      questionTextFrames === NORMALIZED_QUESTION_TEXT_FRAMES_24K &&
      questionWordSeconds >= MIN_QUESTION_WORD_SECONDS &&
      questionWordSeconds <= MAX_QUESTION_WORD_SECONDS &&
      questionTextRemainderSeconds >= MIN_QUESTION_TEXT_REMAINDER_SECONDS
    ) {
      matches.push({ bodyQuestionGap, questionTextGap });
    }
  }

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one exact normalized body -> Question -> text signature, found ${matches.length}`,
    );
  }
  return matches[0];
}

export function fixGrade2ThreeSetOneSecondPausesWav(buffer, questionId) {
  const id = Number(questionId);
  if (!Number.isInteger(id) || id < 1 || id > 30) {
    throw new Error(`Unsupported Grade 2 listening question: ${questionId}`);
  }

  const parsed = parsePcmWav(buffer);
  const introGap = findVerifiedIntroGap(parsed);
  const { bodyQuestionGap, questionTextGap } = findExactNormalizedQuestionGaps(parsed);

  // Always edit from latest to earliest so every detected frame range remains
  // anchored to the immutable normalized source WAV.
  const questionTextFixed = replaceSilenceAtFrames(
    buffer,
    questionTextGap[0],
    questionTextGap[1],
    TARGET_QUESTION_TEXT_SECONDS,
  );
  const bodyQuestionFixed = replaceSilenceAtFrames(
    questionTextFixed.buffer,
    bodyQuestionGap[0],
    bodyQuestionGap[1],
    TARGET_ONE_SECOND,
  );
  const introFixed = replaceSilenceAtFrames(
    bodyQuestionFixed.buffer,
    introGap[0],
    introGap[1],
    TARGET_ONE_SECOND,
  );

  return {
    buffer: introFixed.buffer,
    changed: questionTextFixed.changed || bodyQuestionFixed.changed || introFixed.changed,
    fix: "set-grade2-three-set-pauses-1s-1s-0.8s",
    introGapStartFrame: introFixed.startFrame,
    originalIntroGapFrames: introFixed.originalFrames,
    targetIntroGapFrames: introFixed.targetFrames,
    introGapDeltaFrames: introFixed.deltaFrames,
    bodyQuestionGapStartFrame: bodyQuestionFixed.startFrame,
    originalBodyQuestionGapFrames: bodyQuestionFixed.originalFrames,
    targetBodyQuestionGapFrames: bodyQuestionFixed.targetFrames,
    bodyQuestionGapDeltaFrames: bodyQuestionFixed.deltaFrames,
    questionGapStartFrame: questionTextFixed.startFrame,
    originalQuestionGapFrames: questionTextFixed.originalFrames,
    targetQuestionGapFrames: questionTextFixed.targetFrames,
    questionGapDeltaFrames: questionTextFixed.deltaFrames,
  };
}
