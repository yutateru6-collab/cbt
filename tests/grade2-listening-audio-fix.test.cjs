const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const THREE_SET_RELEASE = "20260817-grade2-sets01-03-listening-pauses-1s-v1";
const DUPLICATE_FIX_RELEASE = "20260817-set01-listening-duplicate-question-fix-v1";
const DUPLICATE_FIX_IDS = new Set([6, 7, 8, 10, 12, 14]);

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

async function loadModule(file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

function frameCount(buffer) {
  return buffer.readUInt32LE(40) / 2;
}

async function main() {
  const legacy = await loadModule("listening-audio-fix.js");
  const threeSet = await loadModule("grade2-listening-three-set-audio-fix.js");

  assert.equal(legacy.GRADE2_LISTENING_FIX_RELEASE, "20260817-set01-listening-q5-q9-fix-v1");
  assert.equal(legacy.GRADE2_LISTENING_QUESTION_GAP_RELEASE, "20260817-set01-listening-q1-q5-question-gap-v1");
  assert.equal(legacy.GRADE2_LISTENING_INTRO_GAP_RELEASE, "20260817-set01-listening-q1-q5-intro08-v1");
  assert.equal(legacy.GRADE2_LISTENING_ONE_SECOND_PAUSES_RELEASE, "20260817-set01-listening-q1-q5-intro-bodyq-1s-v1");
  assert.equal(threeSet.GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE, THREE_SET_RELEASE);
  assert.equal(threeSet.GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_RELEASE, DUPLICATE_FIX_RELEASE);

  // Keep historical Set 01 release behavior covered for old immutable URLs.
  const q1QuestionGap = [774867, 789267];
  const q1BodyGap = [744255, 763455];
  const q1IntroGap = [23244, 76991];
  const q1Frames = 830000;
  const q1Samples = new Int16Array(q1Frames);
  q1Samples.fill(1200);
  q1Samples.fill(0, q1IntroGap[0], q1IntroGap[1]);
  q1Samples.fill(0, q1BodyGap[0], q1BodyGap[1]);
  q1Samples.fill(0, q1QuestionGap[0], q1QuestionGap[1]);
  const q1 = makeMonoPcmWav(q1Samples);
  const q1Buffer = q1.buffer.slice(q1.byteOffset, q1.byteOffset + q1.byteLength);

  const questionOnly = legacy.fixGrade2Set01QuestionGapWav(q1Buffer.slice(0), 1);
  assert.equal(questionOnly.originalQuestionGapFrames, 14400);
  assert.equal(questionOnly.targetQuestionGapFrames, 19200);
  assert.equal(questionOnly.addedQuestionGapFrames, 4800);

  const intro08 = legacy.fixGrade2Set01IntroAndQuestionGapWav(q1Buffer.slice(0), 1);
  assert.equal(intro08.targetIntroGapFrames, 19200);
  assert.equal(intro08.targetQuestionGapFrames, 19200);

  const oneSecond = legacy.fixGrade2Set01OneSecondPausesWav(q1Buffer.slice(0), 1);
  assert.equal(oneSecond.targetIntroGapFrames, 24000);
  assert.equal(oneSecond.targetBodyQuestionGapFrames, 24000);
  assert.equal(oneSecond.targetQuestionGapFrames, 19200);

  // Historical No.5 duplicate-tail route remains available for old URLs.
  const q5Frames = 700000;
  const q5Samples = new Int16Array(q5Frames);
  q5Samples.fill(1200);
  q5Samples.fill(0, 500000, 519200);
  q5Samples.fill(0, 531200, 545600);
  q5Samples.fill(1500, 545600, 649753);
  q5Samples.fill(2000, 649753);
  const q5 = makeMonoPcmWav(q5Samples);
  const q5Fixed = legacy.fixGrade2Set01ListeningWav(
    q5.buffer.slice(q5.byteOffset, q5.byteOffset + q5.byteLength),
    5,
  );
  assert.equal(q5Fixed.fix, "remove-second-question");
  assert.equal(frameCount(Buffer.from(q5Fixed.buffer)), 649753);

  // Historical No.9 opening-pause route also stays backward compatible.
  const q9Samples = new Int16Array(24000 + 72000 + 48000);
  q9Samples.fill(1200, 0, 24000);
  q9Samples.fill(0, 24000, 96000);
  q9Samples.fill(1400, 96000);
  const q9 = makeMonoPcmWav(q9Samples);
  const q9Fixed = legacy.fixGrade2Set01ListeningWav(
    q9.buffer.slice(q9.byteOffset, q9.byteOffset + q9.byteLength),
    9,
  );
  assert.equal(q9Fixed.fix, "shorten-no9-intro-pause");
  assert.equal(q9Fixed.removedFrames, 72000 - 19200);

  // The shared override changes the 90 production Listening questions, with
  // only the six user-confirmed Set 01 duplicate items routed to the overlay.
  const overrideSource = fs.readFileSync(path.join(root, "grade2-listening-set01-audio-fixes.js"), "utf8");
  const makeQuestions = () => Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    part: index < 15 ? "Part 1" : "Part 2",
    audioFile: `old-${index + 1}.wav`,
  }));
  const sets = [
    { key: "set-01", listeningQuestions: makeQuestions() },
    { key: "set-02", listeningQuestions: makeQuestions() },
    { key: "set-03", listeningQuestions: makeQuestions() },
    { key: "set-04", listeningQuestions: makeQuestions() },
  ];
  vm.runInNewContext(overrideSource, { window: { scbtGrade2VocabSets: sets }, Set }, {
    filename: "grade2-listening-set01-audio-fixes.js",
  });

  let total = 0;
  let overlayCount = 0;
  for (const set of sets.slice(0, 3)) {
    for (const question of set.listeningQuestions) {
      const id = Number(question.id);
      const part = id <= 15 ? "part1" : "part2";
      const number = String(id).padStart(2, "0");
      const useOverlay = set.key === "set-01" && part === "part1" && DUPLICATE_FIX_IDS.has(id);
      const expectedRelease = useOverlay ? DUPLICATE_FIX_RELEASE : THREE_SET_RELEASE;
      assert.equal(question.audioRelease, expectedRelease);
      assert.equal(
        question.audioFile,
        `./audio-r2/grade2/releases/${expectedRelease}/${set.key}/listening/${part}/No${number}.wav`,
      );
      if (useOverlay) overlayCount += 1;
      total += 1;
    }
  }
  assert.equal(total, 90);
  assert.equal(overlayCount, 6);
  assert.equal(sets[3].listeningQuestions[0].audioFile, "old-1.wav");
  assert.equal(sets[3].listeningQuestions[0].audioRelease, undefined);

  const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
  assert.ok(examHtml.indexOf("grade2-listening-part2-sets.js") < examHtml.indexOf("grade2-listening-set01-audio-fixes.js"));
  assert.ok(examHtml.indexOf("grade2-listening-set01-audio-fixes.js") < examHtml.indexOf("exam-data.js"));
  assert.match(examHtml, /grade2-set01-duplicate-question-fix-v1/);

  const workerSource = fs.readFileSync(path.join(root, "cloudflare-worker.js"), "utf8");
  assert.match(workerSource, /GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE/);
  assert.match(workerSource, /fixGrade2ThreeSetOneSecondPausesWav/);
  assert.match(workerSource, /set-01\|set-02\|set-03/);
  assert.match(workerSource, /part1/);
  assert.match(workerSource, /part2/);
  assert.match(workerSource, /GRADE2_LISTENING_ONE_SECOND_PAUSES_RELEASE/);
  assert.match(workerSource, /GRADE2_LISTENING_FIX_RELEASE/);
  assert.match(workerSource, /GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_RELEASE/);
  assert.match(workerSource, /sourceRelease: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE/);

  const wrangler = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
  assert.match(wrangler, /"binding"\s*:\s*"MIMILISTEN_AUDIO"/);
  assert.match(wrangler, /"bucket_name"\s*:\s*"mimilisten-audio"/);
  assert.match(wrangler, /"binding"\s*:\s*"CBT_PROJECT_ARCHIVE"/);
  assert.match(wrangler, /"bucket_name"\s*:\s*"cbt-project-archive"/);

  for (const swFile of ["sw.js", "sw-set02-v2.js"]) {
    const sw = fs.readFileSync(path.join(root, swFile), "utf8");
    assert.match(sw, /grade2-listening-set01-audio-fixes\.js/);
    assert.match(sw, /url\.pathname\.startsWith\("\/audio-r2\/"\)/);
  }

  console.log("grade2 listening legacy and targeted duplicate routing tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});