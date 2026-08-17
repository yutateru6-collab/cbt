import assert from "node:assert/strict";
import worker from "../cloudflare-worker.js";
import { GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE } from "../grade2-listening-three-set-audio-fix.js";

const expectedBody = new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0]).buffer;

function makeEnv() {
  const requestedKeys = [];
  return {
    requestedKeys,
    env: {
      MIMILISTEN_AUDIO: {
        async get(key) {
          requestedKeys.push(key);
          return {
            httpEtag: '"test-etag"',
            customMetadata: { fix: "precomputed-test" },
            async arrayBuffer() {
              return expectedBody.slice(0);
            },
          };
        },
      },
      CBT_PROJECT_ARCHIVE: {
        async head() {
          return { exists: true };
        },
        async put() {
          throw new Error("archive put should not be needed when backup already exists");
        },
      },
      ASSETS: {
        async fetch() {
          return new Response("asset fallback", { headers: { "Content-Type": "text/html" } });
        },
      },
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
  const url =
    `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE}/` +
    `${setKey}/listening/${part}/No${number}.wav`;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200, url);
  assert.equal(response.headers.get("Content-Type"), "audio/wav", url);
  assert.equal((await response.arrayBuffer()).byteLength, expectedBody.byteLength, url);
  assert.equal(requestedKeys.length, 1, url);
  assert.equal(
    requestedKeys[0],
    `scbt/grade2/releases/${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE}/${setKey}/listening/${part}/No${number}.wav`,
    url,
  );
}

{
  const { env } = makeEnv();
  env.MIMILISTEN_AUDIO.get = async () => null;
  const url =
    `https://example.test/audio-r2/grade2/releases/${GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE}/` +
    "set-03/listening/part2/No30.wav";
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Precomputed listening audio not found/);
}

console.log("cloudflare unified listening route tests passed");
