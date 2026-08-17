import { createHash } from "node:crypto";
import {
  GRADE2_LISTENING_FIX_RELEASE,
  GRADE2_LISTENING_ONE_SECOND_PAUSES_RELEASE,
  GRADE2_LISTENING_SOURCE_RELEASE,
  fixGrade2Set01ListeningWav,
  fixGrade2Set01OneSecondPausesWav,
} from "../listening-audio-fix.js";

const args = process.argv.slice(2);
const expectedOnly = args.includes("--expected-only");
const publicBase = String(
  args.find((arg) => !arg.startsWith("--")) || process.env.CBT_PUBLIC_BASE_URL || "",
).replace(/\/+$/, "");

if (!expectedOnly && !publicBase) {
  throw new Error(
    "Usage: node scripts/verify-cloudflare-listening-audio.mjs <worker-base-url> | --expected-only",
  );
}

const sourceBase =
  `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${GRADE2_LISTENING_SOURCE_RELEASE}/set-01/listening/part1`;

function sha256(buffer) {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

async function fetchArrayBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return {
    buffer: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") || "",
  };
}

for (let id = 1; id <= 9; id += 1) {
  const number = String(id).padStart(2, "0");
  const sourceUrl = `${sourceBase}/No${number}.wav`;
  const source = await fetchArrayBuffer(sourceUrl);

  const correction =
    id <= 5
      ? {
          release: GRADE2_LISTENING_ONE_SECOND_PAUSES_RELEASE,
          fixed: fixGrade2Set01OneSecondPausesWav(source.buffer, id),
        }
      : {
          release: GRADE2_LISTENING_FIX_RELEASE,
          fixed: fixGrade2Set01ListeningWav(source.buffer, id),
        };

  if (!correction.fixed.changed) {
    throw new Error(`Expected a verified correction for Set 01 No.${number}`);
  }

  if (id <= 5) {
    if (correction.fixed.targetIntroGapFrames !== 24000) {
      throw new Error(
        `Set 01 No.${number} intro gap target is not exactly 24,000 frames: ${correction.fixed.targetIntroGapFrames}`,
      );
    }
    if (correction.fixed.targetBodyQuestionGapFrames !== 24000) {
      throw new Error(
        `Set 01 No.${number} body->Question gap target is not exactly 24,000 frames: ${correction.fixed.targetBodyQuestionGapFrames}`,
      );
    }
    if (correction.fixed.targetQuestionGapFrames !== 19200) {
      throw new Error(
        `Set 01 No.${number} Question->text gap target is not exactly 19,200 frames: ${correction.fixed.targetQuestionGapFrames}`,
      );
    }
  }

  const expectedSha = sha256(correction.fixed.buffer);
  const expectedBytes = correction.fixed.buffer.byteLength;
  const pauseNote = id <= 5
    ? ` intro=${correction.fixed.targetIntroGapFrames}/1.000s bodyQuestion=${correction.fixed.targetBodyQuestionGapFrames}/1.000s questionText=${correction.fixed.targetQuestionGapFrames}/0.800s originalIntro=${correction.fixed.originalIntroGapFrames}`
    : "";

  if (expectedOnly) {
    console.log(`No.${number} expected=${expectedSha} bytes=${expectedBytes}${pauseNote}`);
    continue;
  }

  const actualUrl =
    `${publicBase}/audio-r2/grade2/releases/${correction.release}/set-01/listening/part1/No${number}.wav` +
    `?verify=${encodeURIComponent(process.env.CBT_BUILD_SHA || Date.now())}`;
  const actual = await fetchArrayBuffer(actualUrl);
  if (!actual.contentType.toLowerCase().startsWith("audio/")) {
    throw new Error(`Unexpected content type for No.${number}: ${actual.contentType}`);
  }

  const actualSha = sha256(actual.buffer);
  const actualBytes = actual.buffer.byteLength;

  console.log(
    `No.${number} expected=${expectedSha} actual=${actualSha} bytes=${actualBytes}${pauseNote}`,
  );

  if (actualBytes !== expectedBytes || actualSha !== expectedSha) {
    throw new Error(
      `Cloudflare audio mismatch for Set 01 No.${number}: ` +
        `expected ${expectedBytes}/${expectedSha}, got ${actualBytes}/${actualSha}`,
    );
  }
}

if (expectedOnly) {
  console.log("Verified real baseline masters can be transformed by the current correction code");
} else {
  console.log(`Verified Set 01 corrected listening audio against ${publicBase}`);
}
