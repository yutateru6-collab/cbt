const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function makeMonoPcmWav(samples, sampleRate = 24000) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(samples[index], 44 + index * 2);
  }
  return buffer;
}

async function loadAudioFixModule() {
  const source = fs.readFileSync(path.join(root, "listening-audio-fix.js"), "utf8");
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  return import(url);
}

function readFrameCount(buffer) {
  return buffer.readUInt32LE(40) / 2;
}

function wavData(buffer) {
  return buffer.subarray(44);
}

function readSample(buffer, frame) {
  return buffer.readInt16LE(44 + frame * 2);
}

async function main() {
  const {
    GRADE2_LISTENING_FIX_RELEASE,
    GRADE2_LISTENING_QUESTION_GAP_RELEASE,
    GRADE2_LISTENING_INTRO_GAP_RELEASE,
    fixGrade2Set01ListeningWav,
    fixGrade2Set01QuestionGapWav,
    fixGrade2Set01IntroAndQuestionGapWav,
  } = await loadAudioFixModule();

  assert.equal(GRADE2_LISTENING_FIX_RELEASE, "20260817-set01-listening-q5-q9-fix-v1");
  assert.equal(GRADE2_LISTENING_QUESTION_GAP_RELEASE, "20260817-set01-listening-q1-q5-question-gap-v1");
  assert.equal(GRADE2_LISTENING_INTRO_GAP_RELEASE, "20260817-set01-listening-q1-q5-intro08-v1");

  const verifiedQuestionGaps = {
    1: [774867, 789267],
    2: [737776, 752176],
    3: [718758, 733158],
    4: [676356, 690756],
    5: [681985, 696385],
  };
  const verifiedIntroGaps = {
    1: [23244, 76991],
    2: [24456, 57408],
    3: [25462, 46564],
    4: [26972, 55976],
    5: [16835, 31831],
  };

  // Existing Question-gap release remains backward-compatible for No.1-No.4.
  for (const [idText, range] of Object.entries(verifiedQuestionGaps).filter(([id]) => Number(id) <= 4)) {
    const id = Number(idText);
    const totalFrames = range[1] + 36000;
    const samples = new Int16Array(totalFrames);
    samples.fill(1200);
    samples.fill(0, range[0], range[1]);
    const source = makeMonoPcmWav(samples);
    const fixed = fixGrade2Set01QuestionGapWav(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), id);
    const output = Buffer.from(fixed.buffer);
    assert.equal(fixed.fix, "set-question-gap-0.8s");
    assert.equal(fixed.originalQuestionGapFrames, 14400);
    assert.equal(fixed.targetQuestionGapFrames, 19200);
    assert.equal(fixed.addedQuestionGapFrames, 4800);
    assert.equal(readFrameCount(output), totalFrames + 4800);
    assert.deepEqual(
      wavData(output).subarray(0, range[0] * 2),
      wavData(source).subarray(0, range[0] * 2),
      `No.${id} speech before the target gap must stay byte-identical`,
    );
    assert.deepEqual(
      wavData(output).subarray((range[0] + 19200) * 2),
      wavData(source).subarray(range[1] * 2),
      `No.${id} speech after the target gap must stay byte-identical`,
    );
  }

  // New active release: real measured No.X -> body gaps and Question -> text gaps
  // are both exactly 19,200 frames = 0.800 seconds at 24 kHz for No.1-No.5.
  for (const id of [1, 2, 3, 4, 5]) {
    const introRange = verifiedIntroGaps[id];
    const questionRange = verifiedQuestionGaps[id];
    const totalFrames = questionRange[1] + 36000;
    const samples = new Int16Array(totalFrames);
    samples.fill(1200);
    samples.fill(0, introRange[0], introRange[1]);
    samples.fill(0, questionRange[0], questionRange[1]);
    const source = makeMonoPcmWav(samples);
    const fixed = fixGrade2Set01IntroAndQuestionGapWav(
      source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
      id,
    );
    const output = Buffer.from(fixed.buffer);
    const introOriginal = introRange[1] - introRange[0];
    const introDelta = 19200 - introOriginal;
    const questionFinalStart = questionRange[0] + introDelta;
    const expectedFrames = totalFrames + 4800 + introDelta;

    assert.equal(fixed.fix, "set-intro-and-question-gaps-0.8s");
    assert.equal(fixed.originalIntroGapFrames, introOriginal);
    assert.equal(fixed.targetIntroGapFrames, 19200, `No.${id} intro gap must be exactly 0.800s`);
    assert.equal(fixed.originalQuestionGapFrames, 14400);
    assert.equal(fixed.targetQuestionGapFrames, 19200, `No.${id} Question gap must be exactly 0.800s`);
    assert.equal(readFrameCount(output), expectedFrames);

    assert.equal(readSample(output, introRange[0] - 1), 1200);
    for (let frame = introRange[0]; frame < introRange[0] + 19200; frame += 1) {
      assert.equal(readSample(output, frame), 0, `No.${id} intro target must be zero-filled at frame ${frame}`);
    }
    assert.equal(readSample(output, introRange[0] + 19200), 1200);

    assert.equal(readSample(output, questionFinalStart - 1), 1200);
    for (let frame = questionFinalStart; frame < questionFinalStart + 19200; frame += 1) {
      assert.equal(readSample(output, frame), 0, `No.${id} Question target must be zero-filled at frame ${frame}`);
    }
    assert.equal(readSample(output, questionFinalStart + 19200), 1200);
  }

  // Keep the historical q5-q9 transform test isolated for backward compatibility.
  const q5Frames = 700000;
  const q5Samples = new Int16Array(q5Frames);
  q5Samples.fill(1200);
  const q5BodyGap = [500000, 519200];
  const q5QuestionGap = [531200, 545600];
  q5Samples.fill(0, q5BodyGap[0], q5BodyGap[1]);
  q5Samples.fill(0, q5QuestionGap[0], q5QuestionGap[1]);
  q5Samples.fill(1500, q5QuestionGap[1], 649753);
  q5Samples.fill(2000, 649753);
  const q5 = makeMonoPcmWav(q5Samples);

  const q5OldFixed = fixGrade2Set01ListeningWav(q5.buffer.slice(q5.byteOffset, q5.byteOffset + q5.byteLength), 5);
  const q5OldOutput = Buffer.from(q5OldFixed.buffer);
  assert.equal(q5OldFixed.fix, "remove-second-question");
  assert.equal(readFrameCount(q5OldOutput), 649753);
  assert.equal(q5OldOutput.readUInt32LE(4), q5OldOutput.length - 8);
  assert.equal(q5OldOutput.readUInt32LE(40), q5OldOutput.length - 44);

  const q5NewFixed = fixGrade2Set01QuestionGapWav(q5.buffer.slice(q5.byteOffset, q5.byteOffset + q5.byteLength), 5);
  const q5NewOutput = Buffer.from(q5NewFixed.buffer);
  assert.equal(q5NewFixed.fix, "remove-second-question-and-set-question-gap-0.8s");
  assert.equal(q5NewFixed.questionGapStartFrame, q5QuestionGap[0]);
  assert.equal(q5NewFixed.originalQuestionGapFrames, 14400);
  assert.equal(q5NewFixed.targetQuestionGapFrames, 19200);
  assert.equal(q5NewFixed.addedQuestionGapFrames, 4800);
  assert.equal(readFrameCount(q5NewOutput), 649753 + 4800);
  assert.equal(q5NewOutput.readInt16LE(q5NewOutput.length - 2), 1500, "No.5 duplicate tail must remain removed");

  const voiceFrames = 24000;
  const longPauseFrames = 72000;
  const tailFrames = 48000;
  const q9Samples = new Int16Array(voiceFrames + longPauseFrames + tailFrames);
  q9Samples.fill(1200, 0, voiceFrames);
  q9Samples.fill(0, voiceFrames, voiceFrames + longPauseFrames);
  q9Samples.fill(1400, voiceFrames + longPauseFrames);
  const q9 = makeMonoPcmWav(q9Samples);
  const q9Fixed = fixGrade2Set01ListeningWav(q9.buffer.slice(q9.byteOffset, q9.byteOffset + q9.byteLength), 9);
  const q9Output = Buffer.from(q9Fixed.buffer);
  assert.equal(q9Fixed.fix, "shorten-no9-intro-pause");
  assert.equal(q9Fixed.removedFrames, 72000 - 19200);
  assert.equal(readFrameCount(q9Output), voiceFrames + 19200 + tailFrames);

  const shortPauseSamples = new Int16Array(voiceFrames + 12000 + tailFrames);
  shortPauseSamples.fill(1200, 0, voiceFrames);
  shortPauseSamples.fill(0, voiceFrames, voiceFrames + 12000);
  shortPauseSamples.fill(1400, voiceFrames + 12000);
  const shortPause = makeMonoPcmWav(shortPauseSamples);
  const shortFixed = fixGrade2Set01ListeningWav(shortPause.buffer.slice(shortPause.byteOffset, shortPause.byteOffset + shortPause.byteLength), 9);
  assert.equal(shortFixed.changed, false);
  assert.equal(shortFixed.fix, "no9-intro-pause-not-found");

  const overrideSource = fs.readFileSync(path.join(root, "grade2-listening-set01-audio-fixes.js"), "utf8");
  const questions = Array.from({ length: 10 }, (_, index) => ({
    id: index + 1,
    part: "Part 1",
    audioFile: `old-${index + 1}.wav`,
  }));
  const otherSetQ5 = { id: 5, part: "Part 1", audioFile: "set02-old.wav" };
  const sandbox = {
    window: {
      scbtGrade2VocabSets: [
        { key: "set-01", listeningQuestions: questions },
        { key: "set-02", listeningQuestions: [otherSetQ5] },
      ],
    },
    Set,
  };
  vm.runInNewContext(overrideSource, sandbox, { filename: "grade2-listening-set01-audio-fixes.js" });
  for (const id of [1, 2, 3, 4, 5]) {
    assert.match(questions[id - 1].audioFile, /20260817-set01-listening-q1-q5-intro08-v1/);
    assert.match(questions[id - 1].audioFile, new RegExp(`No0${id}\\.wav$`));
  }
  for (const id of [6, 7, 8, 9]) {
    assert.match(questions[id - 1].audioFile, /20260817-set01-listening-q5-q9-fix-v1/);
    assert.match(questions[id - 1].audioFile, new RegExp(`No0${id}\\.wav$`));
  }
  assert.equal(questions[9].audioFile, "old-10.wav");
  assert.equal(otherSetQ5.audioFile, "set02-old.wav");

  const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
  assert.ok(examHtml.indexOf("grade2-listening-part2-sets.js") < examHtml.indexOf("grade2-listening-set01-audio-fixes.js"));
  assert.ok(examHtml.indexOf("grade2-listening-set01-audio-fixes.js") < examHtml.indexOf("exam-data.js"));
  assert.match(examHtml, /grade2-set01-listening-q1-q5-intro08-v1/);

  const wrangler = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  assert.match(wrangler, /"binding"\s*:\s*"MIMILISTEN_AUDIO"/);
  assert.match(wrangler, /"bucket_name"\s*:\s*"mimilisten-audio"/);
  assert.match(wrangler, /"binding"\s*:\s*"CBT_PROJECT_ARCHIVE"/);
  assert.match(wrangler, /"bucket_name"\s*:\s*"cbt-project-archive"/);

  const workerSource = fs.readFileSync(path.join(root, "cloudflare-worker.js"), "utf8");
  assert.match(workerSource, /GRADE2_LISTENING_INTRO_GAP_RELEASE/);
  assert.match(workerSource, /fixGrade2Set01IntroAndQuestionGapWav/);
  assert.match(workerSource, /No\(01\|02\|03\|04\|05\)/);
  assert.match(workerSource, /No\(05\|06\|07\|08\|09\)/);

  for (const swFile of ["sw.js", "sw-set02-v2.js"]) {
    const sw = fs.readFileSync(path.join(root, swFile), "utf8");
    assert.match(sw, /cbt-grade2-app-shell-v77-canonical-explanations/);
    assert.match(sw, /grade2-listening-set01-audio-fixes\.js/);
    assert.match(sw, /url\.pathname\.startsWith\("\/audio-r2\/"\)/);
  }

  console.log("grade2 listening targeted intro/question-gap tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
