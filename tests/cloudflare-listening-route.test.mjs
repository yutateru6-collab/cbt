import assert from "node:assert/strict";
import worker from "../cloudflare-worker.js";
import {
  GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
  GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
  fixGrade2ThreeSetOneSecondPausesWav,
} from "../grade2-listening-three-set-audio-fix.js";

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
  const { env } = makeEnv();
  env.MIMILISTEN_AUDIO.get = async () => null;
  const url = `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE}/set-01/listening/part1/No10.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Precomputed listening audio not found/);
}

function parsePcmWav(buffer) {
  const bytes = Buffer.from(buffer);
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = bytes.toString("ascii", offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "data") return { bytes, dataOffset: start, dataSize: size, totalFrames: Math.floor(size / 2) };
    offset = start + size + (size % 2);
  }
  throw new Error("WAV data chunk missing");
}

function tailSilenceRuns(parsed, startFrame, minimumFrames = 1920) {
  const runs = [];
  let silenceStart = -1;
  const isSilent = (frame) => Math.abs(parsed.bytes.readInt16LE(parsed.dataOffset + frame * 2)) <= 350;
  for (let frame = startFrame; frame < parsed.totalFrames; frame += 1) {
    if (isSilent(frame)) {
      if (silenceStart < 0) silenceStart = frame;
    } else if (silenceStart >= 0) {
      if (frame - silenceStart >= minimumFrames) runs.push([silenceStart, frame]);
      silenceStart = -1;
    }
  }
  if (silenceStart >= 0 && parsed.totalFrames - silenceStart >= minimumFrames) runs.push([silenceStart, parsed.totalFrames]);
  return runs;
}

// Diagnostic only on this branch: inspect the actual Set 01 No.5 master after
// the accepted 1s / 1s / 0.8s pause transform. This does not alter any audio.
{
  const sourceUrl = "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/20260815-grade2-listening-pauses-v2/set-01/listening/part1/No05.wav";
  const sourceResponse = await fetch(`${sourceUrl}?no05-diagnostic=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
  assert.equal(sourceResponse.status, 200);
  const source = await sourceResponse.arrayBuffer();
  const normal = fixGrade2ThreeSetOneSecondPausesWav(source, 5);
  const parsed = parsePcmWav(normal.buffer);
  const runs = tailSilenceRuns(parsed, Math.max(0, parsed.totalFrames - 180000));
  console.log("NO05_DUPLICATE_DIAGNOSTIC", JSON.stringify({ totalFrames: parsed.totalFrames, runs, runSeconds: runs.map(([start, end]) => [Number((start / 24000).toFixed(6)), Number((end / 24000).toFixed(6)), Number(((end - start) / 24000).toFixed(6))]) }));
}

console.log("cloudflare unified and six-item v2 listening route tests passed");
