const assert = require("node:assert/strict");

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
  for (let index = 0; index < samples.length; index += 1) buffer.writeInt16LE(samples[index], 44 + index * 2);
  return buffer;
}

async function loadModule() {
  const fs = require("node:fs");
  const path = require("node:path");
  const source = fs.readFileSync(path.resolve(__dirname, "..", "grade2-listening-three-set-audio-fix.js"), "utf8");
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

function data(buffer) { return buffer.subarray(44); }
function sample(buffer, frame) { return buffer.readInt16LE(44 + frame * 2); }

function makeValidSource() {
  const totalFrames = 300000;
  const samples = new Int16Array(totalFrames);
  for (let frame = 0; frame < totalFrames; frame += 1) samples[frame] = 1000 + (frame % 97);
  const intro = [24000, 54000];
  const bodyQuestion = [200000, 219200];
  const questionText = [231200, 245600];
  samples.fill(0, intro[0], intro[1]);
  samples.fill(0, bodyQuestion[0], bodyQuestion[1]);
  samples.fill(0, questionText[0], questionText[1]);
  return { source: makeMonoPcmWav(samples), totalFrames, intro, bodyQuestion, questionText };
}

(async () => {
  const {
    GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_RELEASE,
    GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
    GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
    fixGrade2Set01DuplicateQuestionFromOneSecondWav,
    fixGrade2Set01DuplicateQuestionV2FromOneSecondWav,
    fixGrade2ThreeSetOneSecondPausesWav,
  } = await loadModule();

  assert.equal(GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE, "20260817-grade2-sets01-03-listening-pauses-1s-v1");
  assert.equal(GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_RELEASE, "20260817-set01-listening-duplicate-question-fix-v1");
  assert.equal(GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE, "20260817-set01-listening-duplicate-question-fix-v2");

  const { source, totalFrames, intro, bodyQuestion, questionText } = makeValidSource();
  const fixed = fixGrade2ThreeSetOneSecondPausesWav(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), 1);
  const output = Buffer.from(fixed.buffer);
  const introDelta = 24000 - (intro[1] - intro[0]);
  const bodyDelta = 24000 - (bodyQuestion[1] - bodyQuestion[0]);
  const questionDelta = 19200 - (questionText[1] - questionText[0]);
  const bodyFinalStart = bodyQuestion[0] + introDelta;
  const questionFinalStart = questionText[0] + introDelta + bodyDelta;

  assert.equal(fixed.fix, "set-grade2-three-set-pauses-1s-1s-0.8s");
  assert.equal(fixed.targetIntroGapFrames, 24000);
  assert.equal(fixed.targetBodyQuestionGapFrames, 24000);
  assert.equal(fixed.targetQuestionGapFrames, 19200);
  assert.equal(output.readUInt32LE(40) / 2, totalFrames + introDelta + bodyDelta + questionDelta);
  for (let frame = intro[0]; frame < intro[0] + 24000; frame += 1) assert.equal(sample(output, frame), 0);
  for (let frame = bodyFinalStart; frame < bodyFinalStart + 24000; frame += 1) assert.equal(sample(output, frame), 0);
  for (let frame = questionFinalStart; frame < questionFinalStart + 19200; frame += 1) assert.equal(sample(output, frame), 0);
  assert.deepEqual(data(output).subarray(0, intro[0] * 2), data(source).subarray(0, intro[0] * 2));
  assert.deepEqual(data(output).subarray((intro[0] + 24000) * 2, bodyFinalStart * 2), data(source).subarray(intro[1] * 2, bodyQuestion[0] * 2));
  assert.deepEqual(data(output).subarray((bodyFinalStart + 24000) * 2, questionFinalStart * 2), data(source).subarray(bodyQuestion[1] * 2, questionText[0] * 2));
  assert.deepEqual(data(output).subarray((questionFinalStart + 19200) * 2), data(source).subarray(questionText[1] * 2));

  // Historical v1 remains immutable/backward-compatible only.
  const v1Samples = new Int16Array(760000);
  v1Samples.fill(1200);
  const v1Source = makeMonoPcmWav(v1Samples);
  const v1Fixed = fixGrade2Set01DuplicateQuestionFromOneSecondWav(
    v1Source.buffer.slice(v1Source.byteOffset, v1Source.byteOffset + v1Source.byteLength), 6,
  );
  assert.equal(v1Fixed.fix, "remove-user-confirmed-duplicate-question-tail-v1");
  assert.equal(v1Fixed.trimFrame, 683562);

  // V2 must touch exactly the six approved IDs and must only truncate the rear
  // duplicate: every kept PCM byte must be identical to the accepted normal1s input.
  const v2Cases = [
    { id: 6, total: 791087, trim: 707562, silenceAtTrim: false },
    { id: 7, total: 884055, trim: 702988, silenceAtTrim: true },
    { id: 8, total: 864858, trim: 748632, silenceAtTrim: true },
    { id: 10, total: 873824, trim: 769265, silenceAtTrim: true },
    { id: 12, total: 848780, trim: 741045, silenceAtTrim: true },
    { id: 14, total: 827740, trim: 721151, silenceAtTrim: true },
  ];
  for (const { id, total, trim, silenceAtTrim } of v2Cases) {
    const samples = new Int16Array(total);
    for (let frame = 0; frame < total; frame += 1) samples[frame] = 1100 + (frame % 41);
    if (silenceAtTrim) samples.fill(0, trim, trim + 3000);
    const wav = makeMonoPcmWav(samples);
    const result = fixGrade2Set01DuplicateQuestionV2FromOneSecondWav(
      wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength), id,
    );
    const resultBuffer = Buffer.from(result.buffer);
    assert.equal(result.fix, "remove-verified-rear-duplicate-question-tail-v2");
    assert.equal(result.sourceFrames, total);
    assert.equal(result.trimFrame, trim);
    assert.equal(resultBuffer.readUInt32LE(40) / 2, trim);
    assert.deepEqual(data(resultBuffer), data(wav).subarray(0, trim * 2), `No.${id} kept prefix`);
  }
  assert.throws(
    () => fixGrade2Set01DuplicateQuestionV2FromOneSecondWav(makeMonoPcmWav(new Int16Array(800000)).buffer, 9),
    /Unsupported Set 01 duplicate-question V2 question/,
  );
  assert.throws(
    () => fixGrade2Set01DuplicateQuestionV2FromOneSecondWav(makeMonoPcmWav(new Int16Array(800000)).buffer, 7),
    /Unexpected V2 source frame count/,
  );

  const ambiguousIntro = new Int16Array(300000);
  ambiguousIntro.fill(1200);
  ambiguousIntro.fill(0, 12000, 20000);
  ambiguousIntro.fill(0, 30000, 38000);
  ambiguousIntro.fill(0, 200000, 219200);
  ambiguousIntro.fill(0, 231200, 245600);
  const ambiguousIntroWav = makeMonoPcmWav(ambiguousIntro);
  assert.throws(
    () => fixGrade2ThreeSetOneSecondPausesWav(ambiguousIntroWav.buffer.slice(ambiguousIntroWav.byteOffset, ambiguousIntroWav.byteOffset + ambiguousIntroWav.byteLength), 1),
    /No\.X -> body gap, found 2/,
  );

  const wrongQuestionSignature = new Int16Array(300000);
  wrongQuestionSignature.fill(1200);
  wrongQuestionSignature.fill(0, 24000, 54000);
  wrongQuestionSignature.fill(0, 200000, 218000);
  wrongQuestionSignature.fill(0, 230000, 244400);
  const wrongQuestionWav = makeMonoPcmWav(wrongQuestionSignature);
  assert.throws(
    () => fixGrade2ThreeSetOneSecondPausesWav(wrongQuestionWav.buffer.slice(wrongQuestionWav.byteOffset, wrongQuestionWav.byteOffset + wrongQuestionWav.byteLength), 1),
    /exact normalized body -> Question -> text signature, found 0/,
  );

  console.log("grade2 three-set pause and six-item V2 prefix-trim tests passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
