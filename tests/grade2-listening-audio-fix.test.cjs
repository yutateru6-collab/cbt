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
  samples.forEach((sample, index) => buffer.writeInt16LE(sample, 44 + index * 2));
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

async function main() {
  const { fixGrade2Set01ListeningWav } = await loadAudioFixModule();

  const q5Frames = 700000;
  const q5Samples = new Array(q5Frames).fill(900);
  const q5 = makeMonoPcmWav(q5Samples);
  const q5Fixed = fixGrade2Set01ListeningWav(q5.buffer.slice(q5.byteOffset, q5.byteOffset + q5.byteLength), 5);
  const q5Output = Buffer.from(q5Fixed.buffer);
  assert.equal(q5Fixed.fix, "remove-second-question");
  assert.equal(readFrameCount(q5Output), 649753);
  assert.equal(q5Output.readUInt32LE(4), q5Output.length - 8);
  assert.equal(q5Output.readUInt32LE(40), q5Output.length - 44);

  const voiceFrames = 24000;
  const longPauseFrames = 72000;
  const tailFrames = 48000;
  const q9 = makeMonoPcmWav([
    ...new Array(voiceFrames).fill(1200),
    ...new Array(longPauseFrames).fill(0),
    ...new Array(tailFrames).fill(1400),
  ]);
  const q9Fixed = fixGrade2Set01ListeningWav(q9.buffer.slice(q9.byteOffset, q9.byteOffset + q9.byteLength), 9);
  const q9Output = Buffer.from(q9Fixed.buffer);
  assert.equal(q9Fixed.fix, "shorten-no9-intro-pause");
  assert.equal(q9Fixed.removedFrames, 72000 - 19200);
  assert.equal(readFrameCount(q9Output), voiceFrames + 19200 + tailFrames);

  const shortPause = makeMonoPcmWav([
    ...new Array(voiceFrames).fill(1200),
    ...new Array(12000).fill(0),
    ...new Array(tailFrames).fill(1400),
  ]);
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
  for (const id of [5, 6, 7, 8, 9]) {
    assert.match(questions[id - 1].audioFile, /20260817-set01-listening-q5-q9-fix-v1/);
    assert.match(questions[id - 1].audioFile, new RegExp(`No0${id}\\.wav$`));
  }
  assert.equal(questions[3].audioFile, "old-4.wav");
  assert.equal(questions[9].audioFile, "old-10.wav");
  assert.equal(otherSetQ5.audioFile, "set02-old.wav");

  const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
  assert.ok(examHtml.indexOf("grade2-listening-part2-sets.js") < examHtml.indexOf("grade2-listening-set01-audio-fixes.js"));
  assert.ok(examHtml.indexOf("grade2-listening-set01-audio-fixes.js") < examHtml.indexOf("exam-data.js"));

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

  console.log("grade2 listening Q5-Q9 audio fix tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
