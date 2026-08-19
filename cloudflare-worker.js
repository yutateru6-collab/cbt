import {
  GRADE2_LISTENING_FIX_RELEASE,
  GRADE2_LISTENING_INTRO_GAP_RELEASE,
  GRADE2_LISTENING_ONE_SECOND_PAUSES_RELEASE,
  GRADE2_LISTENING_QUESTION_GAP_RELEASE,
  GRADE2_LISTENING_SOURCE_RELEASE,
  fixGrade2Set01IntroAndQuestionGapWav,
  fixGrade2Set01ListeningWav,
  fixGrade2Set01OneSecondPausesWav,
  fixGrade2Set01QuestionGapWav,
} from "./listening-audio-fix.js";
import {
  GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_RELEASE,
  GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
  GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
  fixGrade2Set01DuplicateQuestionFromOneSecondWav,
  fixGrade2Set01DuplicateQuestionV2FromOneSecondWav,
  fixGrade2ThreeSetOneSecondPausesWav,
} from "./grade2-listening-three-set-audio-fix.js";
import {
  GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE,
  fixGrade2Set01No05DuplicateFromOneSecondWav,
} from "./grade2-listening-set01-no05-duplicate-fix.js";

const R2_KEY_PREFIX = "scbt/grade2/releases";
const LISTENING_CORRECTIONS = Object.freeze([
  Object.freeze({
    release: GRADE2_LISTENING_SET01_NO05_DUPLICATE_FIX_RELEASE,
    sourceRelease: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(05)\.wav$/,
    transform: fixGrade2Set01No05DuplicateFromOneSecondWav,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE,
    sourceRelease: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(06|07|08|10|12|14)\.wav$/,
    transform: fixGrade2Set01DuplicateQuestionV2FromOneSecondWav,
    precomputedOnly: true,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_RELEASE,
    sourceRelease: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(06|07|08|10|12|14)\.wav$/,
    transform: fixGrade2Set01DuplicateQuestionFromOneSecondWav,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
    pathPattern: /^(?:set-01|set-02|set-03)\/listening\/part1\/No(0[1-9]|1[0-5])\.wav$/,
    transform: fixGrade2ThreeSetOneSecondPausesWav,
    precomputedOnly: true,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE,
    pathPattern: /^(?:set-01|set-02|set-03)\/listening\/part2\/No(1[6-9]|2[0-9]|30)\.wav$/,
    transform: fixGrade2ThreeSetOneSecondPausesWav,
    precomputedOnly: true,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_ONE_SECOND_PAUSES_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(01|02|03|04|05)\.wav$/,
    transform: fixGrade2Set01OneSecondPausesWav,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_INTRO_GAP_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(01|02|03|04|05)\.wav$/,
    transform: fixGrade2Set01IntroAndQuestionGapWav,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_QUESTION_GAP_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(01|02|03|04|05)\.wav$/,
    transform: fixGrade2Set01QuestionGapWav,
  }),
  Object.freeze({
    release: GRADE2_LISTENING_FIX_RELEASE,
    pathPattern: /^set-01\/listening\/part1\/No(05|06|07|08|09)\.wav$/,
    transform: fixGrade2Set01ListeningWav,
  }),
]);

function rangeNotSatisfiable(headers, size) {
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Range", `bytes */${size}`);
  headers.set("Content-Length", "0");
  return new Response(null, { status: 416, headers });
}

function parseSingleByteRange(value, size) {
  if (!value || !value.startsWith("bytes=") || value.includes(",")) {
    return null;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2]) || size <= 0) {
    return null;
  }

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) {
      return null;
    }
    start = Math.max(0, size - suffixLength);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (
      !Number.isSafeInteger(start) ||
      !Number.isSafeInteger(end) ||
      start < 0 ||
      start >= size ||
      end < start
    ) {
      return null;
    }
    end = Math.min(end, size - 1);
  }

  return { start, end };
}

function respondWithAudioBuffer(request, buffer, extraHeaders = {}) {
  const size = buffer.byteLength;
  const headers = new Headers(extraHeaders);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", "audio/wav");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  const rangeHeader = request.headers.get("Range");
  if (!rangeHeader) {
    headers.set("Content-Length", String(size));
    return new Response(request.method === "HEAD" ? null : buffer, {
      status: 200,
      headers,
    });
  }

  const range = parseSingleByteRange(rangeHeader, size);
  if (!range) return rangeNotSatisfiable(headers, size);
  const body = buffer.slice(range.start, range.end + 1);
  headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
  headers.set("Content-Length", String(body.byteLength));
  return new Response(request.method === "HEAD" ? null : body, {
    status: 206,
    headers,
  });
}

function getFixedListeningRequest(pathname) {
  let matchedRelease = false;
  for (const correction of LISTENING_CORRECTIONS) {
    const routePrefix = `/audio-r2/grade2/releases/${correction.release}/`;
    if (!pathname.startsWith(routePrefix)) continue;
    matchedRelease = true;
    const relativePath = pathname.slice(routePrefix.length);
    const match = correction.pathPattern.exec(relativePath);
    if (!match) continue;
    const sourceRelease = correction.sourceRelease || GRADE2_LISTENING_SOURCE_RELEASE;
    return {
      release: correction.release,
      sourceRelease,
      relativePath,
      questionId: Number(match[1]),
      transform: correction.transform,
      precomputedOnly: correction.precomputedOnly === true,
      sourceKey: `${R2_KEY_PREFIX}/${sourceRelease}/${relativePath}`,
      targetKey: `${R2_KEY_PREFIX}/${correction.release}/${relativePath}`,
    };
  }
  return matchedRelease ? { error: "Unsupported listening correction path." } : null;
}

async function backupCorrectedAudioIfNeeded(env, info, buffer, fixName) {
  if (!env.CBT_PROJECT_ARCHIVE) throw new Error("CBT_PROJECT_ARCHIVE R2 binding is unavailable");
  const existing = await env.CBT_PROJECT_ARCHIVE.head(info.targetKey);
  if (existing) return;
  await env.CBT_PROJECT_ARCHIVE.put(info.targetKey, buffer, {
    httpMetadata: {
      contentType: "audio/wav",
      cacheControl: "public, max-age=31536000, immutable",
    },
    customMetadata: {
      sourceRelease: info.sourceRelease,
      fixRelease: info.release,
      questionId: String(info.questionId),
      fix: fixName,
    },
  });
}

async function loadOrCreateCorrectedListeningAudio(env, info) {
  if (!env.MIMILISTEN_AUDIO) throw new Error("MIMILISTEN_AUDIO R2 binding is unavailable");
  if (!env.CBT_PROJECT_ARCHIVE) throw new Error("CBT_PROJECT_ARCHIVE R2 binding is unavailable");

  let targetObject = await env.MIMILISTEN_AUDIO.get(info.targetKey);
  if (targetObject) {
    const buffer = await targetObject.arrayBuffer();
    await backupCorrectedAudioIfNeeded(
      env,
      info,
      buffer,
      targetObject.customMetadata?.fix || "verified-existing",
    );
    return { buffer, etag: targetObject.httpEtag || "" };
  }

  if (info.precomputedOnly) {
    throw new Error(`Precomputed listening audio not found: ${info.targetKey}`);
  }

  const sourceObject = await env.MIMILISTEN_AUDIO.get(info.sourceKey);
  if (!sourceObject) throw new Error(`Source listening audio not found: ${info.sourceKey}`);
  const sourceBuffer = await sourceObject.arrayBuffer();
  const fixed = info.transform(sourceBuffer, info.questionId);
  if (!fixed.changed) {
    throw new Error(`Listening correction made no verified change for No.${info.questionId}`);
  }

  const httpMetadata = {
    contentType: "audio/wav",
    cacheControl: "public, max-age=31536000, immutable",
  };
  const customMetadata = {
    sourceRelease: info.sourceRelease,
    fixRelease: info.release,
    questionId: String(info.questionId),
    fix: fixed.fix,
  };

  await Promise.all([
    env.MIMILISTEN_AUDIO.put(info.targetKey, fixed.buffer, { httpMetadata, customMetadata }),
    env.CBT_PROJECT_ARCHIVE.put(info.targetKey, fixed.buffer, { httpMetadata, customMetadata }),
  ]);
  targetObject = await env.MIMILISTEN_AUDIO.head(info.targetKey);
  return { buffer: fixed.buffer, etag: targetObject?.httpEtag || "" };
}

async function handleCorrectedListeningAudio(request, env, info) {
  try {
    const result = await loadOrCreateCorrectedListeningAudio(env, info);
    return respondWithAudioBuffer(request, result.buffer, result.etag ? { ETag: result.etag } : {});
  } catch (error) {
    return new Response(`Listening audio correction unavailable: ${error instanceof Error ? error.message : "unknown error"}`, {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isReadableMethod = request.method === "GET" || request.method === "HEAD";
    const fixedListeningRequest = getFixedListeningRequest(url.pathname);
    if (fixedListeningRequest) {
      if (!isReadableMethod) return new Response("Method not allowed.", { status: 405 });
      if (fixedListeningRequest.error) return new Response(fixedListeningRequest.error, { status: 404 });
      return handleCorrectedListeningAudio(request, env, fixedListeningRequest);
    }

    const isWav = url.pathname.startsWith("/assets/audio/") && url.pathname.endsWith(".wav");
    if (!isWav || !isReadableMethod) {
      return env.ASSETS.fetch(request);
    }

    const assetHeaders = new Headers(request.headers);
    assetHeaders.delete("Range");
    assetHeaders.delete("If-Range");
    const assetResponse = await env.ASSETS.fetch(
      new Request(request.url, { method: "GET", headers: assetHeaders }),
    );
    if (!assetResponse.ok) {
      return assetResponse;
    }

    const assetContentType = assetResponse.headers.get("Content-Type") || "";
    if (!assetContentType.toLowerCase().startsWith("audio/")) {
      return new Response("Audio file not found.", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }

    const headers = new Headers(assetResponse.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Type", "audio/wav");
    const rangeHeader = request.headers.get("Range");
    if (!rangeHeader) {
      return new Response(request.method === "HEAD" ? null : assetResponse.body, {
        status: assetResponse.status,
        headers,
      });
    }

    const fullAudio = await assetResponse.arrayBuffer();
    const size = fullAudio.byteLength;
    const range = parseSingleByteRange(rangeHeader, size);
    if (!range) {
      return rangeNotSatisfiable(headers, size);
    }

    const body = fullAudio.slice(range.start, range.end + 1);
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
    headers.set("Content-Length", String(body.byteLength));
    return new Response(request.method === "HEAD" ? null : body, {
      status: 206,
      headers,
    });
  },
};
