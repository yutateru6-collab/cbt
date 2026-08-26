import assert from "node:assert/strict";
import worker, { GRADE2_SPEAKING_RELEASE } from "../cloudflare-worker.js";
import {
  GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
  GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
} from "../grade2-listening-three-set-audio-fix.js";
import {
  GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE,
  fixGrade2Set01No05DuplicateFromOneSecondWav,
} from "../grade2-listening-set01-no05-duplicate-fix.js";

const expectedBody = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0]).buffer;
function makeEnv() {
  const requestedKeys = [];
  return {
    requestedKeys,
    env: {
      MIMILISTEN_AUDIO: {
        async get(key) {
          requestedKeys.push(key);
          return { httpEtag: '"test-etag"', customMetadata: { fix: "precomputed-test" }, async arrayBuffer() { return expectedBody.slice(0); } };
        },
      },
      CBT_PROJECT_ARCHIVE: { async head() { return { exists: true }; }, async put() { throw new Error("archive put should not be needed"); } },
      ASSETS: { async fetch() { return new Response("asset fallback", { headers: { "Content-Type": "text/html" } }); } },
    },
  };
}

for (const relativePath of [
  "common/sound-check.wav",
  "instructions/speaking-start-ja.wav",
  "instructions/listening-part1-ja.wav",
  "sample/warmup-1.wav",
  "sample/no-1.wav",
  "sample/no-3.wav",
  "sample/no-4.wav",
]) {
  const { env, requestedKeys } = makeEnv();
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_SPEAKING_RELEASE}/${relativePath}`;
  const response = await worker.fetch(new Request(url, { headers: { Range: "bytes=0-3" } }), env);
  assert.equal(response.status, 206, url);
  assert.equal(response.headers.get("Content-Type"), "audio/wav", url);
  assert.equal(response.headers.get("Content-Range"), `bytes 0-3/${expectedBody.byteLength}`, url);
  assert.equal((await response.arrayBuffer()).byteLength, 4, url);
  assert.equal(requestedKeys[0], `scbt/grade2/releases/${GRADE2_SPEAKING_RELEASE}/${relativePath}`, url);
}

{
  const { env } = makeEnv();
  env.MIMILISTEN_AUDIO.get = async () => null;
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_SPEAKING_RELEASE}/sample/no-1.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /not found/i);
}

{
  const { env } = makeEnv();
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_SPEAKING_RELEASE}/sample/unknown.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Unsupported Grade 2 speaking audio path/);
}

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

function makeVerifiedNo05OneSecondWav() {
  const totalFrames = 750883;
  const trimFrame = 658757;
  const samples = new Int16Array(totalFrames);
  for (let frame = 0; frame < totalFrames; frame += 1) samples[frame] = 1000 + (frame % 73);
  samples.fill(0, trimFrame, trimFrame + 24000);
  const questionCueEnd = trimFrame + 24000 + 13032;
  samples.fill(0, questionCueEnd, questionCueEnd + 19200);
  return makeMonoPcmWav(samples);
}

function pcmData(buffer) {
  return Buffer.from(buffer).subarray(44);
}

for (const { setKey, part, number } of [
  { setKey: "set-01", part: "part1", number: "01" },
  { setKey: "set-01", part: "part2", number: "16" },
  { setKey: "set-02", part: "part1", number: "15" },
  { setKey: "set-02", part: "part2", number: "30" },
  { setKey: "set-03", part: "part1", number: "07" },
  { setKey: "set-03", part: "part2", number: "24" },
]) {
  const { env, requestedKeys } = makeEnv();
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE}/${setKey}/listening/${part}/No${number}.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200, url);
  assert.equal(response.headers.get("Content-Type"), "audio/wav", url);
  assert.equal((await response.arrayBuffer()).byteLength, expectedBody.byteLength, url);
  assert.equal(requestedKeys[0], `scbt/grade2/releases/${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE}/${setKey}/listening/${part}/No${number}.wav`, url);
}

for (const number of ["06", "07", "08", "10", "12", "14"]) {
  const { env, requestedKeys } = makeEnv();
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE}/set-01/listening/part1/No${number}.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200, url);
  assert.equal(requestedKeys[0], `scbt/grade2/releases/${GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE}/set-01/listening/part1/No${number}.wav`);
}

{
  const source = makeVerifiedNo05OneSecondWav();
  const fixed = fixGrade2Set01No05DuplicateFromOneSecondWav(
    source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    5,
  );
  const fixedBuffer = Buffer.from(fixed.buffer);
  assert.equal(GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE, "20260820-set01-listening-no05-duplicate-question-fix-v1");
  assert.equal(fixed.fix, "remove-set01-no05-rear-duplicate-question-only");
  assert.equal(fixed.sourceFrames, 750883);
  assert.equal(fixed.trimFrame, 658757);
  assert.equal(fixed.removedFrames, 92126);
  assert.equal(fixedBuffer.readUInt32LE(40) / 2, 658757);
  assert.deepEqual(pcmData(fixedBuffer), pcmData(source).subarray(0, 658757 * 2));
  assert.throws(
    () => fixGrade2Set01No05DuplicateFromOneSecondWav(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), 4),
    /No\.5-only/,
  );
}

{
  const source = makeVerifiedNo05OneSecondWav();
  const sourceBuffer = source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
  const targetKey = `scbt/grade2/releases/${GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE}/set-01/listening/part1/No05.wav`;
  const sourceKey = `scbt/grade2/releases/${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE}/set-01/listening/part1/No05.wav`;
  const requestedKeys = [];
  const productionWrites = [];
  const archiveWrites = [];
  let generated = null;
  const env = {
    MIMILISTEN_AUDIO: {
      async get(key) {
        requestedKeys.push(key);
        if (key === targetKey) {
          return generated
            ? { httpEtag: '"generated-etag"', customMetadata: { fix: "remove-set01-no05-rear-duplicate-question-only" }, async arrayBuffer() { return generated.slice(0); } }
            : null;
        }
        if (key === sourceKey) {
          return { async arrayBuffer() { return sourceBuffer.slice(0); } };
        }
        return null;
      },
      async put(key, buffer, options) {
        productionWrites.push({ key, buffer: buffer.slice(0), options });
        if (key === targetKey) generated = buffer.slice(0);
      },
      async head(key) {
        return key === targetKey && generated ? { httpEtag: '"generated-etag"' } : null;
      },
    },
    CBT_PROJECT_ARCHIVE: {
      async head() { return null; },
      async put(key, buffer, options) { archiveWrites.push({ key, buffer: buffer.slice(0), options }); },
    },
    ASSETS: { async fetch() { throw new Error("No.5 correction must not fall through to assets"); } },
  };

  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE}/set-01/listening/part1/No05.wav`;
  const response = await worker.fetch(new Request(url, { headers: { Range: "bytes=0-43" } }), env);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("Content-Type"), "audio/wav");
  assert.equal((await response.arrayBuffer()).byteLength, 44);
  assert.deepEqual(requestedKeys.slice(0, 2), [targetKey, sourceKey]);
  assert.equal(productionWrites.length, 1);
  assert.equal(productionWrites[0].key, targetKey);
  assert.equal(Buffer.from(productionWrites[0].buffer).readUInt32LE(40) / 2, 658757);
  assert.equal(archiveWrites.length, 1);
  assert.equal(archiveWrites[0].key, targetKey);
  assert.equal(productionWrites[0].options.customMetadata.sourceRelease, GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE);
  assert.equal(productionWrites[0].options.customMetadata.questionId, "5");
}

{
  const { env } = makeEnv();
  env.MIMILISTEN_AUDIO.get = async () => null;
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE}/set-01/listening/part1/No10.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Precomputed listening audio not found/);
}

console.log("cloudflare unified, No.5-only, and six-item v2 listening route tests passed");
