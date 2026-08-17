export const GRADE2_LISTENING_SOURCE_RELEASE = "20260815-grade2-listening-pauses-v2";
export const GRADE2_LISTENING_FIX_RELEASE = "20260817-set01-listening-q5-q9-fix-v1";
export const GRADE2_LISTENING_QUESTION_GAP_RELEASE = "20260817-set01-listening-q1-q5-question-gap-v1";
export const GRADE2_LISTENING_INTRO_GAP_RELEASE = "20260817-set01-listening-q1-q5-intro08-v1";

const PCM_SILENCE_THRESHOLD = 350;
const INTRO_TARGET_SILENCE_SECONDS = 0.8;
const INTRO_LONG_SILENCE_SECONDS = 1.4;
const INTRO_SEARCH_SECONDS = 8;
const QUESTION_TEXT_TARGET_SILENCE_SECONDS = 0.8;
const NORMALIZED_QUESTION_TEXT_SILENCE_SECONDS = 0.6;
const MIN_SILENCE_SECONDS = 0.15;
const MIN_BODY_QUESTION_GAP_SECONDS = 0.35;
const MAX_BODY_QUESTION_GAP_SECONDS = 2.0;
const MIN_QUESTION_WORD_SECONDS = 0.20;
const MAX_QUESTION_WORD_SECONDS = 1.20;
const MIN_QUESTION_TEXT_GAP_SECONDS = 0.35;
const MAX_QUESTION_TEXT_GAP_SECONDS = 1.20;
const MIN_QUESTION_TEXT_REMAINDER_SECONDS = 1.20;

// Historical correction boundaries retained for the existing q5-q9 release.
const SET01_PART1_FIRST_QUESTION_END_FRAME = Object.freeze({
  5: 649753,
  6: 674704,
  7: 585028,
  8: 634271,
});

// Exact Question -> question-text gaps in the active normalized 20260815 masters.
// All are 0.6 seconds (14,400 frames at 24 kHz) before the targeted 0.8-second correction.
const SET01_PART1_NORMALIZED_QUESTION_TEXT_GAP = Object.freeze({
  1: Object.freeze([774867, 789267]),
  2: Object.freeze([737776, 752176]),
  3: Object.freeze([718758, 733158]),
  4: Object.freeze([676356, 690756]),
  5: Object.freeze([681985, 696385]),
});

// Verified No.X -> body silence ranges measured from the real R2
// 20260815-grade2-listening-pauses-v2 masters on 2026-08-17.
// These are the first substantial pauses immediately after the spoken item number.
const SET01_PART1_VERIFIED_INTRO_GAP = Object.freeze({
  1: Object.freeze([23244, 76991]),
  2: Object.freeze([24456, 57408]),
  3: Object.freeze([25462, 46564]),
  4: Object.freeze([26972, 55976]),
  5: Object.freeze([16835, 31831]),
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

function assertSilentFrameRange(parsed, startFrame, endFrame) {
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || startFrame >= endFrame || endFrame > totalFrames) {
    throw new Error(`Invalid silence frame range: ${startFrame}-${endFrame}/${totalFrames}`);
  }
  for (let frame = startFrame; frame < endFrame; frame += 1) {
    const sample = Math.abs(parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true));
    if (sample > PCM_SILENCE_THRESHOLD) {
      throw new Error(`Expected silence at frame ${frame}, got PCM level ${sample}`);
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
  const replacement = new Uint8Array(beforeBytes + targetFrames * frameWidth + (sourceData.byteLength - afterOffset));
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

function findSilenceRuns(buffer, startFrame = 0, endFrame = null) {
  const parsed = parsePcmWav(buffer);
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const start = Math.max(0, Math.min(totalFrames, Number.isInteger(startFrame) ? startFrame : 0));
  const end = Math.max(start, Math.min(totalFrames, Number.isInteger(endFrame) ? endFrame : totalFrames));
  const minimumFrames = Math.round(parsed.format.sampleRate * MIN_SILENCE_SECONDS);
  const runs = [];
  let silenceStart = -1;

  for (let frame = start; frame < end; frame += 1) {
    const sample = Math.abs(parsed.view.getInt16(parsed.data.dataOffset + frame * parsed.format.blockAlign, true));
    const silent = sample <= PCM_SILENCE_THRESHOLD;
    if (silent) {
      if (silenceStart < 0) silenceStart = frame;
      continue;
    }
    if (silenceStart >= 0) {
      if (frame - silenceStart >= minimumFrames) runs.push([silenceStart, frame]);
      silenceStart = -1;
    }
  }
  if (silenceStart >= 0 && end - silenceStart >= minimumFrames) runs.push([silenceStart, end]);
  return { parsed, runs };
}

function findQuestionTextGapByStructure(buffer) {
  const parsed = parsePcmWav(buffer);
  const totalFrames = Math.floor(parsed.data.dataSize / parsed.format.blockAlign);
  const searchStart = Math.floor(totalFrames / 2);
  const { runs } = findSilenceRuns(buffer, searchStart, totalFrames);
  const matches = [];

  for (let index = 0; index < runs.length - 1; index += 1) {
    const bodyQuestionGap = runs[index];
    const questionTextGap = runs[index + 1];
    const bodyGapSeconds = (bodyQuestionGap[1] - bodyQuestionGap[0]) / parsed.format.sampleRate;
    const questionWordSeconds = (questionTextGap[0] - bodyQuestionGap[1]) / parsed.format.sampleRate;
    const questionTextGapSeconds = (questionTextGap[1] - questionTextGap[0]) / parsed.format.sampleRate;
    const questionTextRemainderSeconds = (totalFrames - questionTextGap[1]) / parsed.format.sampleRate;

    if (
      bodyGapSeconds >= MIN_BODY_QUESTION_GAP_SECONDS &&
      bodyGapSeconds <= MAX_BODY_QUESTION_GAP_SECONDS &&
      questionWordSeconds >= MIN_QUESTION_WORD_SECONDS &&
      questionWordSeconds <= MAX_QUESTION_WORD_SECONDS &&
      questionTextGapSeconds >= MIN_QUESTION_TEXT_GAP_SECONDS &&
      questionTextGapSeconds <= MAX_QUESTION_TEXT_GAP_SECONDS &&
      questionTextRemainderSeconds >= MIN_QUESTION_TEXT_REMAINDER_SECONDS
    ) {
      matches.push({ bodyQuestionGap, questionTextGap });
    }
  }

  if (matches.length !== 1) {
    throw new Error(`Expected exactly one Question -> question-text gap, found ${matches.length}`);
  }
  return matches[0].questionTextGap;
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

export function fixGrade2Set01QuestionGapWav(buffer, questionId) {
  const id = Number(questionId);
  if (id < 1 || id > 5) {
    throw new Error(`Unsupported Grade 2 set-01 question-gap fix question: ${questionId}`);
  }

  if (id === 5) {
    const duplicateFixed = fixGrade2Set01ListeningWav(buffer, 5);
    const questionTextGap = findQuestionTextGapByStructure(duplicateFixed.buffer);
    const gapFixed = replaceSilenceAtFrames(
      duplicateFixed.buffer,
      questionTextGap[0],
      questionTextGap[1],
      QUESTION_TEXT_TARGET_SILENCE_SECONDS,
    );
    return {
      buffer: gapFixed.buffer,
      changed: true,
      fix: "remove-second-question-and-set-question-gap-0.8s",
      questionGapStartFrame: gapFixed.startFrame,
      originalQuestionGapFrames: gapFixed.originalFrames,
      targetQuestionGapFrames: gapFixed.targetFrames,
      addedQuestionGapFrames: gapFixed.deltaFrames,
    };
  }

  const range = SET01_PART1_NORMALIZED_QUESTION_TEXT_GAP[id];
  if (!range) throw new Error(`Missing verified question-gap range for No.${id}`);
  const parsed = parsePcmWav(buffer);
  const expectedFrames = Math.round(parsed.format.sampleRate * NORMALIZED_QUESTION_TEXT_SILENCE_SECONDS);
  if (range[1] - range[0] !== expectedFrames) {
    throw new Error(`Unexpected verified question-gap size for No.${id}: ${range[1] - range[0]}/${expectedFrames}`);
  }
  const gapFixed = replaceSilenceAtFrames(
    buffer,
    range[0],
    range[1],
    QUESTION_TEXT_TARGET_SILENCE_SECONDS,
  );
  return {
    buffer: gapFixed.buffer,
    changed: gapFixed.changed,
    fix: "set-question-gap-0.8s",
    questionGapStartFrame: gapFixed.startFrame,
    originalQuestionGapFrames: gapFixed.originalFrames,
    targetQuestionGapFrames: gapFixed.targetFrames,
    addedQuestionGapFrames: gapFixed.deltaFrames,
  };
}

export function fixGrade2Set01IntroAndQuestionGapWav(buffer, questionId) {
  const id = Number(questionId);
  if (id < 1 || id > 5) {
    throw new Error(`Unsupported Grade 2 set-01 intro-gap fix question: ${questionId}`);
  }

  const introRange = SET01_PART1_VERIFIED_INTRO_GAP[id];
  const questionRange = SET01_PART1_NORMALIZED_QUESTION_TEXT_GAP[id];
  if (!introRange || !questionRange) {
    throw new Error(`Missing verified Set 01 gap ranges for No.${id}`);
  }

  const parsed = parsePcmWav(buffer);
  if (parsed.format.sampleRate !== 24000) {
    throw new Error(`Expected 24 kHz Set 01 master for No.${id}, got ${parsed.format.sampleRate}`);
  }
  const expectedQuestionFrames = Math.round(parsed.format.sampleRate * NORMALIZED_QUESTION_TEXT_SILENCE_SECONDS);
  if (questionRange[1] - questionRange[0] !== expectedQuestionFrames) {
    throw new Error(
      `Unexpected verified question-gap size for No.${id}: ${questionRange[1] - questionRange[0]}/${expectedQuestionFrames}`,
    );
  }

  // Apply the later Question -> question-text edit first so the verified intro
  // frame positions remain exactly those measured from the immutable baseline.
  const questionFixed = replaceSilenceAtFrames(
    buffer,
    questionRange[0],
    questionRange[1],
    QUESTION_TEXT_TARGET_SILENCE_SECONDS,
  );
  const introFixed = replaceSilenceAtFrames(
    questionFixed.buffer,
    introRange[0],
    introRange[1],
    INTRO_TARGET_SILENCE_SECONDS,
  );

  return {
    buffer: introFixed.buffer,
    changed: questionFixed.changed || introFixed.changed,
    fix: "set-intro-and-question-gaps-0.8s",
    introGapStartFrame: introFixed.startFrame,
    originalIntroGapFrames: introFixed.originalFrames,
    targetIntroGapFrames: introFixed.targetFrames,
    introGapDeltaFrames: introFixed.deltaFrames,
    questionGapStartFrame: questionFixed.startFrame,
    originalQuestionGapFrames: questionFixed.originalFrames,
    targetQuestionGapFrames: questionFixed.targetFrames,
    questionGapDeltaFrames: questionFixed.deltaFrames,
  };
}
