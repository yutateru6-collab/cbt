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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isWav = url.pathname.startsWith("/assets/audio/") && url.pathname.endsWith(".wav");
    const isReadableMethod = request.method === "GET" || request.method === "HEAD";
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
