var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// current/index.js
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  static {
    __name2(this, "HttpError");
  }
  status;
  code;
  details;
  constructor(status, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
};
var MAX_JSON_BYTES = 512 * 1024;
var HEX_64 = /^[a-f0-9]{64}$/;
function newRequestId() {
  return crypto.randomUUID();
}
__name(newRequestId, "newRequestId");
__name2(newRequestId, "newRequestId");
async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
__name2(sha256Hex, "sha256Hex");
function constantTimeHexEqual(left, right) {
  const cleanLeft = left.toLowerCase();
  const cleanRight = right.toLowerCase();
  if (!HEX_64.test(cleanLeft) || !HEX_64.test(cleanRight)) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < cleanLeft.length; index += 1) {
    difference |= cleanLeft.charCodeAt(index) ^ cleanRight.charCodeAt(index);
  }
  return difference === 0;
}
__name(constantTimeHexEqual, "constantTimeHexEqual");
__name2(constantTimeHexEqual, "constantTimeHexEqual");
async function readJsonBody(request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new HttpError(415, "unsupported_media_type", "JSON\u5F62\u5F0F\u3067\u9001\u4FE1\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0 || parsedLength > MAX_JSON_BYTES) {
      throw new HttpError(413, "request_too_large", "\u9001\u4FE1\u30C7\u30FC\u30BF\u304C\u5927\u304D\u3059\u304E\u307E\u3059\u3002");
    }
  }
  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_JSON_BYTES) {
    throw new HttpError(413, "request_too_large", "\u9001\u4FE1\u30C7\u30FC\u30BF\u304C\u5927\u304D\u3059\u304E\u307E\u3059\u3002");
  }
  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
  } catch {
    throw new HttpError(400, "invalid_json", "JSON\u306E\u5F62\u5F0F\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093\u3002");
  }
}
__name(readJsonBody, "readJsonBody");
__name2(readJsonBody, "readJsonBody");
function assertSameOriginMutation(request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin !== expectedOrigin) {
    throw new HttpError(403, "origin_rejected", "\u3053\u306E\u753B\u9762\u4EE5\u5916\u304B\u3089\u306E\u4FDD\u5B58\u8981\u6C42\u306F\u62D2\u5426\u3055\u308C\u307E\u3057\u305F\u3002");
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite !== null && fetchSite !== "same-origin") {
    throw new HttpError(403, "cross_site_rejected", "\u5225\u30B5\u30A4\u30C8\u304B\u3089\u306E\u4FDD\u5B58\u8981\u6C42\u306F\u62D2\u5426\u3055\u308C\u307E\u3057\u305F\u3002");
  }
}
__name(assertSameOriginMutation, "assertSameOriginMutation");
__name2(assertSameOriginMutation, "assertSameOriginMutation");
function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
function errorResponse(error) {
  if (error instanceof HttpError) {
    const body = { error: error.message, code: error.code };
    if (error.details !== void 0) {
      body.details = error.details;
    }
    return jsonResponse(body, error.status);
  }
  return jsonResponse(
    { error: "\u51E6\u7406\u4E2D\u306B\u4E88\u671F\u3057\u306A\u3044\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002", code: "internal_error" },
    500
  );
}
__name(errorResponse, "errorResponse");
__name2(errorResponse, "errorResponse");
function applySecurityHeaders(response, env, requestId, isApi) {
  const secured = new Response(response.body, response);
  const frameOrigin = env.EDGE_EXTENSION_ORIGIN || "'none'";
  secured.headers.set("X-Content-Type-Options", "nosniff");
  secured.headers.set("Referrer-Policy", "no-referrer");
  secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  secured.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  secured.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' ${frameOrigin}`
  );
  secured.headers.set("X-Request-Id", requestId);
  if (isApi) {
    secured.headers.set("Cache-Control", "no-store");
  } else {
    secured.headers.set("Cache-Control", "no-cache");
  }
  return secured;
}
__name(applySecurityHeaders, "applySecurityHeaders");
__name2(applySecurityHeaders, "applySecurityHeaders");
function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  try {
    const decoded = atob(base64);
    return Uint8Array.from(decoded, (character) => character.charCodeAt(0)).buffer;
  } catch {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093\u3002");
  }
}
__name(decodeBase64Url, "decodeBase64Url");
__name2(decodeBase64Url, "decodeBase64Url");
function decodeJwtJson(value) {
  try {
    const bytes = decodeBase64Url(value);
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093\u3002");
  }
}
__name(decodeJwtJson, "decodeJwtJson");
__name2(decodeJwtJson, "decodeJwtJson");
function normalizeTeamDomain(value) {
  const candidate = (value ?? "").trim().toLowerCase().replace(/^https:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(candidate)) {
    throw new HttpError(503, "auth_not_configured", "Cloudflare Access\u306E\u8A2D\u5B9A\u304C\u5B8C\u4E86\u3057\u3066\u3044\u307E\u305B\u3093\u3002");
  }
  return candidate;
}
__name(normalizeTeamDomain, "normalizeTeamDomain");
__name2(normalizeTeamDomain, "normalizeTeamDomain");
async function loadJwks(teamDomain, execution) {
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const cacheKey = new Request(url, { method: "GET" });
  const cache = caches.default;
  let response = await cache.match(cacheKey);
  if (response === void 0) {
    const fetched = await fetch(cacheKey);
    if (!fetched.ok) {
      throw new HttpError(503, "access_keys_unavailable", "\u8A8D\u8A3C\u9375\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
    }
    const body = await fetched.text();
    if (body.length > 256e3) {
      throw new HttpError(503, "access_keys_invalid", "\u8A8D\u8A3C\u9375\u306E\u5FDC\u7B54\u304C\u4E0D\u6B63\u3067\u3059\u3002");
    }
    response = new Response(body, {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" }
    });
    execution.waitUntil(cache.put(cacheKey, response.clone()));
  }
  let document;
  try {
    document = await response.json();
  } catch {
    throw new HttpError(503, "access_keys_invalid", "\u8A8D\u8A3C\u9375\u3092\u8AAD\u307F\u53D6\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  if (!Array.isArray(document.keys) || document.keys.length === 0 || document.keys.length > 20) {
    throw new HttpError(503, "access_keys_invalid", "\u8A8D\u8A3C\u9375\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  return document.keys;
}
__name(loadJwks, "loadJwks");
__name2(loadJwks, "loadJwks");
async function verifyAccessJwt(token, env, execution) {
  if (token.length < 100 || token.length > 16384) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u306E\u9577\u3055\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !part)) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  const [encodedHeader, encodedClaims, encodedSignature] = parts;
  const header = decodeJwtJson(encodedHeader);
  const claims = decodeJwtJson(encodedClaims);
  if (header.alg !== "RS256" || typeof header.kid !== "string" || header.kid.length > 256) {
    throw new HttpError(401, "invalid_access_token", "\u8A31\u53EF\u3055\u308C\u3066\u3044\u306A\u3044\u8A8D\u8A3C\u65B9\u5F0F\u3067\u3059\u3002");
  }
  const teamDomain = normalizeTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const jwks = await loadJwks(teamDomain, execution);
  const jwk = jwks.find((item) => item.kid === header.kid && item.kty === "RSA");
  if (jwk === void 0) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u9375\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002");
  }
  let publicKey;
  try {
    publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  } catch {
    throw new HttpError(503, "access_keys_invalid", "\u8A8D\u8A3C\u9375\u3092\u4F7F\u7528\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  const verified = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    publicKey,
    decodeBase64Url(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`)
  );
  if (!verified) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  const now = Math.floor(Date.now() / 1e3);
  if (typeof claims.exp !== "number" || claims.exp < now - 30) {
    throw new HttpError(401, "access_token_expired", "\u30ED\u30B0\u30A4\u30F3\u671F\u9650\u304C\u5207\u308C\u3066\u3044\u307E\u3059\u3002");
  }
  if (typeof claims.nbf === "number" && claims.nbf > now + 30) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u306F\u307E\u3060\u6709\u52B9\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002");
  }
  if (typeof claims.iat === "number" && claims.iat > now + 60) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u306E\u767A\u884C\u6642\u523B\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  const expectedIssuer = `https://${teamDomain}`;
  if (claims.iss !== expectedIssuer) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u5143\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002");
  }
  const expectedAudience = (env.ACCESS_AUD ?? "").trim();
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!expectedAudience || !audiences.some((audience) => audience === expectedAudience)) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u5148\u304C\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002");
  }
  if (claims.type !== "app") {
    throw new HttpError(401, "invalid_access_token", "\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u7528\u3067\u306F\u306A\u3044\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3\u3067\u3059\u3002");
  }
  return claims;
}
__name(verifyAccessJwt, "verifyAccessJwt");
__name2(verifyAccessJwt, "verifyAccessJwt");
async function verifyAutomationPrincipal(claims, env) {
  if (claims.sub !== "" || typeof claims.common_name !== "string") {
    throw new HttpError(401, "invalid_service_principal", "\u81EA\u52D5\u540C\u671F\u306E\u8A8D\u8A3C\u4E3B\u4F53\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  const commonName = claims.common_name.trim().toLowerCase();
  if (!/^[a-f0-9]{32}\.access$/.test(commonName)) {
    throw new HttpError(401, "invalid_service_principal", "\u81EA\u52D5\u540C\u671F\u306E\u8A8D\u8A3C\u4E3B\u4F53\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  const expectedHash = (env.ACCESS_SERVICE_ID_SHA256 ?? "").trim().toLowerCase();
  const actualHash = await sha256Hex(commonName);
  if (!constantTimeHexEqual(actualHash, expectedHash)) {
    throw new HttpError(403, "service_principal_not_allowed", "\u3053\u306E\u81EA\u52D5\u540C\u671F\u8CC7\u683C\u60C5\u5831\u306B\u306F\u5229\u7528\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093\u3002");
  }
  return commonName;
}
__name(verifyAutomationPrincipal, "verifyAutomationPrincipal");
__name2(verifyAutomationPrincipal, "verifyAutomationPrincipal");
async function verifyAutomationBearer(request, env) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{32,512})$/.exec(authorization);
  const expectedHash = (env.SYNC_TOKEN_SHA256 ?? "").trim().toLowerCase();
  if (match === null || !/^[a-f0-9]{64}$/.test(expectedHash)) {
    throw new HttpError(401, "automation_auth_failed", "\u81EA\u52D5\u540C\u671F\u306E\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  }
  const suppliedToken = match[1];
  if (suppliedToken === void 0) {
    throw new HttpError(401, "automation_auth_failed", "\u81EA\u52D5\u540C\u671F\u306E\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  }
  const suppliedHash = await sha256Hex(suppliedToken);
  if (!constantTimeHexEqual(suppliedHash, expectedHash)) {
    throw new HttpError(401, "automation_auth_failed", "\u81EA\u52D5\u540C\u671F\u306E\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  }
}
__name(verifyAutomationBearer, "verifyAutomationBearer");
__name2(verifyAutomationBearer, "verifyAutomationBearer");
async function authenticate(request, env, execution, automationRoute) {
  const mode = (env.AUTH_MODE ?? "").trim().toLowerCase();
  if (mode === "dev") {
    const hostname = new URL(request.url).hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "[::1]") {
      throw new HttpError(503, "unsafe_dev_mode", "\u958B\u767A\u7528\u8A8D\u8A3C\u306F\u30ED\u30FC\u30AB\u30EB\u63A5\u7D9A\u3067\u306E\u307F\u4F7F\u7528\u3067\u304D\u307E\u3059\u3002");
    }
    return { kind: "development", hash: await sha256Hex("tg-development-actor") };
  }
  if (mode !== "access") {
    throw new HttpError(503, "auth_not_configured", "\u8A8D\u8A3C\u8A2D\u5B9A\u304C\u5B8C\u4E86\u3057\u3066\u3044\u306A\u3044\u305F\u3081\u505C\u6B62\u3057\u3066\u3044\u307E\u3059\u3002");
  }
  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) {
    throw new HttpError(401, "access_login_required", "Cloudflare Access\u3078\u306E\u30ED\u30B0\u30A4\u30F3\u304C\u5FC5\u8981\u3067\u3059\u3002");
  }
  const claims = await verifyAccessJwt(token, env, execution);
  if (automationRoute) {
    await verifyAutomationBearer(request, env);
    const servicePrincipal = await verifyAutomationPrincipal(claims, env);
    return { kind: "automation", hash: await sha256Hex(`tg-automation:${servicePrincipal}`) };
  }
  if (typeof claims.sub !== "string" || claims.sub.length < 8 || claims.sub.length > 512) {
    throw new HttpError(401, "invalid_access_token", "\u8A8D\u8A3C\u4E3B\u4F53\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002");
  }
  if (typeof claims.email !== "string" || claims.email.length > 320) {
    throw new HttpError(403, "email_not_allowed", "\u8A31\u53EF\u3055\u308C\u305F\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3002");
  }
  const allowedHash = (env.ALLOWED_EMAIL_SHA256 ?? "").trim().toLowerCase();
  const actualHash = await sha256Hex(claims.email.trim().toLowerCase());
  if (!constantTimeHexEqual(actualHash, allowedHash)) {
    throw new HttpError(403, "email_not_allowed", "\u3053\u306E\u30A2\u30AB\u30A6\u30F3\u30C8\u306B\u306F\u5229\u7528\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093\u3002");
  }
  return { kind: "browser", hash: await sha256Hex(`tg-browser:${claims.sub}`) };
}
__name(authenticate, "authenticate");
__name2(authenticate, "authenticate");
var LESSON_SELECT = `
  SELECT
    l.*,
    s.family_name AS family_name
  FROM lessons AS l
  JOIN students AS s ON s.id = l.student_id
`;
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
__name2(nowIso, "nowIso");
function weekdayFor(date) {
  const labels = ["\u65E5", "\u6708", "\u706B", "\u6C34", "\u6728", "\u91D1", "\u571F"];
  return labels[(/* @__PURE__ */ new Date(`${date}T00:00:00.000Z`)).getUTCDay()] ?? "?";
}
__name(weekdayFor, "weekdayFor");
__name2(weekdayFor, "weekdayFor");
function mapStudent(row) {
  return {
    id: row.id,
    familyName: row.family_name,
    furigana: row.furigana,
    privateMemo: row.private_memo,
    revision: row.revision,
    updatedAt: row.updated_at
  };
}
__name(mapStudent, "mapStudent");
__name2(mapStudent, "mapStudent");
function mapLesson(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    familyName: row.family_name,
    date: row.lesson_date,
    weekday: weekdayFor(row.lesson_date),
    start: row.start_time,
    end: row.end_time,
    sessionNumber: row.session_number,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    memo: row.memo,
    status: row.status,
    pastedAt: row.pasted_at,
    memoUpdatedAt: row.memo_updated_at,
    memoDate: row.memo_date,
    memoStart: row.memo_start,
    memoEnd: row.memo_end,
    memoScheduleUpdatedAt: row.memo_schedule_updated_at,
    calendarActive: row.calendar_active === 1 && row.suppressed === 0,
    deletedAt: row.suppressed === 1 ? row.updated_at : null,
    revision: row.revision,
    updatedAt: row.updated_at
  };
}
__name(mapLesson, "mapLesson");
__name2(mapLesson, "mapLesson");
async function loadAppState(env) {
  const row = await env.DB.prepare(
    `SELECT privacy_mode, active_week_start, active_week_end, prepared_range_start,
            prepared_range_end, prepared_at, revision, updated_at
       FROM app_state WHERE singleton = 1`
  ).first();
  if (row === null) {
    throw new HttpError(503, "database_not_initialized", "\u30AF\u30E9\u30A6\u30C9\u4FDD\u5B58\u5148\u304C\u521D\u671F\u5316\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
  }
  return row;
}
__name(loadAppState, "loadAppState");
__name2(loadAppState, "loadAppState");
async function getState(env) {
  const [appState, studentResult, lessonResult] = await Promise.all([
    loadAppState(env),
    env.DB.prepare(
      `SELECT id, family_name, furigana, private_memo, revision, last_mutation_id,
              created_at, updated_at
         FROM students
        ORDER BY id
        LIMIT 500`
    ).all(),
    env.DB.prepare(
      `${LESSON_SELECT}
        WHERE l.lesson_date >= date('now', '-730 days')
           OR l.status = 'ready'
        ORDER BY l.lesson_date ASC, l.start_time ASC, l.id ASC
        LIMIT 1000`
    ).all()
  ]);
  const students = {};
  for (const row of studentResult.results) {
    students[row.id] = mapStudent(row);
  }
  const preparedRange = appState.prepared_range_start && appState.prepared_range_end ? {
    start: appState.prepared_range_start,
    end: appState.prepared_range_end,
    label: `${appState.prepared_range_start}\u301C${appState.prepared_range_end}`
  } : null;
  return {
    schemaVersion: 2,
    privacyMode: appState.privacy_mode,
    timezone: "Asia/Tokyo",
    activeWeekStart: appState.active_week_start,
    activeWeekEnd: appState.active_week_end,
    preparedRange,
    preparedAt: appState.prepared_at,
    updatedAt: appState.updated_at,
    revision: appState.revision,
    students,
    lessons: lessonResult.results.map(mapLesson)
  };
}
__name(getState, "getState");
__name2(getState, "getState");
async function loadLesson(env, id) {
  return env.DB.prepare(`${LESSON_SELECT} WHERE l.id = ?1`).bind(id).first();
}
__name(loadLesson, "loadLesson");
__name2(loadLesson, "loadLesson");
async function loadStudent(env, id) {
  return env.DB.prepare(
    `SELECT id, family_name, furigana, private_memo, revision, last_mutation_id,
            created_at, updated_at
       FROM students WHERE id = ?1`
  ).bind(id).first();
}
__name(loadStudent, "loadStudent");
__name2(loadStudent, "loadStudent");
function conflictDetails(row) {
  return "source_key" in row ? mapLesson(row) : mapStudent(row);
}
__name(conflictDetails, "conflictDetails");
__name2(conflictDetails, "conflictDetails");
function assertExpectedRevision(row, expectedRevision) {
  if (row.revision !== expectedRevision) {
    throw new HttpError(
      409,
      "revision_conflict",
      "\u5225\u306EPC\u3067\u5148\u306B\u66F4\u65B0\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u6700\u65B0\u3092\u518D\u8AAD\u307F\u8FBC\u307F\u3057\u3066\u5185\u5BB9\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      { current: conflictDetails(row) }
    );
  }
}
__name(assertExpectedRevision, "assertExpectedRevision");
__name2(assertExpectedRevision, "assertExpectedRevision");
function auditStatement(env, actor, requestId, action, entityType, entityId, oldRevision, newRevision, timestamp) {
  const entityTable = entityType === "lesson" ? "lessons" : entityType === "student" ? "students" : null;
  const condition = entityTable === null ? "1 = 1" : `EXISTS (
           SELECT 1 FROM ${entityTable}
            WHERE id = ?7 AND revision = ?9 AND last_mutation_id = ?2
         )`;
  return env.DB.prepare(
    `INSERT INTO audit_events (
       occurred_at, request_id, actor_hash, actor_type, action,
       entity_type, entity_id, old_revision, new_revision, metadata_json
     )
     SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, '{}'
      WHERE ${condition}`
  ).bind(
    timestamp,
    requestId,
    actor.hash,
    actor.kind,
    action,
    entityType,
    entityId,
    oldRevision,
    newRevision
  );
}
__name(auditStatement, "auditStatement");
__name2(auditStatement, "auditStatement");
function bumpAppStateStatement(env, timestamp, entityType, entityId, newRevision, requestId) {
  const entityTable = entityType === "lesson" ? "lessons" : "students";
  return env.DB.prepare(
    `UPDATE app_state
        SET revision = revision + 1, updated_at = ?1
      WHERE singleton = 1
        AND EXISTS (
          SELECT 1 FROM ${entityTable}
           WHERE id = ?2 AND revision = ?3 AND last_mutation_id = ?4
        )`
  ).bind(timestamp, entityId, newRevision, requestId);
}
__name(bumpAppStateStatement, "bumpAppStateStatement");
__name2(bumpAppStateStatement, "bumpAppStateStatement");
async function executeLessonMutation(env, actor, input, action, update) {
  const before = await loadLesson(env, input.id);
  if (before === null) {
    throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (before.last_mutation_id === input.requestId) {
    return mapLesson(before);
  }
  assertExpectedRevision(before, input.expectedRevision);
  const timestamp = nowIso();
  const batchResult = await env.DB.batch([
    update(timestamp),
    auditStatement(
      env,
      actor,
      input.requestId,
      action,
      "lesson",
      input.id,
      before.revision,
      before.revision + 1,
      timestamp
    ),
    bumpAppStateStatement(
      env,
      timestamp,
      "lesson",
      input.id,
      before.revision + 1,
      input.requestId
    )
  ]);
  if ((batchResult[0]?.meta.changes ?? 0) !== 1) {
    const current = await loadLesson(env, input.id);
    if (current === null) {
      throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    }
    if (current.last_mutation_id === input.requestId) {
      return mapLesson(current);
    }
    assertExpectedRevision(current, input.expectedRevision);
    throw new HttpError(409, "mutation_not_applied", "\u4FDD\u5B58\u7AF6\u5408\u306E\u305F\u3081\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  const updated = await loadLesson(env, input.id);
  if (updated === null) {
    throw new HttpError(500, "mutation_result_missing", "\u4FDD\u5B58\u7D50\u679C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  return mapLesson(updated);
}
__name(executeLessonMutation, "executeLessonMutation");
__name2(executeLessonMutation, "executeLessonMutation");
async function updateMemo(env, actor, input) {
  const current = await loadLesson(env, input.id);
  if (current === null) {
    throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (current.memo === input.memo) {
    return mapLesson(current);
  }
  return executeLessonMutation(
    env,
    actor,
    input,
    "memo.update",
    (timestamp) => env.DB.prepare(
      `UPDATE lessons
          SET memo = ?1,
              memo_updated_at = ?2,
              pasted_at = NULL,
              status = CASE WHEN trim(?1) = '' THEN 'empty' ELSE 'ready' END,
              revision = revision + 1,
              last_mutation_id = ?3,
              updated_at = ?2
        WHERE id = ?4 AND revision = ?5`
    ).bind(input.memo, timestamp, input.requestId, input.id, input.expectedRevision)
  );
}
__name(updateMemo, "updateMemo");
__name2(updateMemo, "updateMemo");
async function updateSchedule(env, actor, input) {
  const current = await loadLesson(env, input.id);
  if (current === null) {
    throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (current.memo_date === input.memoDate && current.memo_start === input.memoStart && current.memo_end === input.memoEnd) {
    return mapLesson(current);
  }
  return executeLessonMutation(
    env,
    actor,
    input,
    "schedule.update",
    (timestamp) => env.DB.prepare(
      `UPDATE lessons
          SET memo_date = ?1,
              memo_start = ?2,
              memo_end = ?3,
              memo_schedule_updated_at = ?4,
              revision = revision + 1,
              last_mutation_id = ?5,
              updated_at = ?4
        WHERE id = ?6 AND revision = ?7`
    ).bind(
      input.memoDate,
      input.memoStart,
      input.memoEnd,
      timestamp,
      input.requestId,
      input.id,
      input.expectedRevision
    )
  );
}
__name(updateSchedule, "updateSchedule");
__name2(updateSchedule, "updateSchedule");
async function deleteLesson(env, actor, input) {
  const current = await loadLesson(env, input.id);
  if (current === null) {
    throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (current.suppressed === 1) {
    return mapLesson(current);
  }
  return executeLessonMutation(
    env,
    actor,
    input,
    "lesson.suppress",
    (timestamp) => env.DB.prepare(
      `UPDATE lessons
          SET calendar_active = 0,
              suppressed = 1,
              revision = revision + 1,
              last_mutation_id = ?1,
              updated_at = ?2
        WHERE id = ?3 AND revision = ?4`
    ).bind(input.requestId, timestamp, input.id, input.expectedRevision)
  );
}
__name(deleteLesson, "deleteLesson");
__name2(deleteLesson, "deleteLesson");
async function updateReportStatus(env, actor, input) {
  const current = await loadLesson(env, input.id);
  if (current === null) {
    throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (!current.memo.trim()) {
    throw new HttpError(400, "memo_required", "\u30E1\u30E2\u304C\u7A7A\u306E\u6388\u696D\u306F\u5831\u544A\u72B6\u614B\u3092\u5909\u66F4\u3067\u304D\u307E\u305B\u3093\u3002");
  }
  if (current.status === input.status) {
    return mapLesson(current);
  }
  return executeLessonMutation(
    env,
    actor,
    input,
    "report-status.update",
    (timestamp) => env.DB.prepare(
      `UPDATE lessons
          SET status = ?1,
              pasted_at = CASE WHEN ?1 = 'pasted' THEN ?2 ELSE NULL END,
              revision = revision + 1,
              last_mutation_id = ?3,
              updated_at = ?2
        WHERE id = ?4 AND revision = ?5 AND trim(memo) <> ''`
    ).bind(input.status, timestamp, input.requestId, input.id, input.expectedRevision)
  );
}
__name(updateReportStatus, "updateReportStatus");
__name2(updateReportStatus, "updateReportStatus");
async function executeStudentMutation(env, actor, input, action, update) {
  const before = await loadStudent(env, input.id);
  if (before === null) {
    throw new HttpError(404, "student_not_found", "\u5BFE\u8C61\u306E\u540D\u5B57\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (before.last_mutation_id === input.requestId) {
    return mapStudent(before);
  }
  assertExpectedRevision(before, input.expectedRevision);
  const timestamp = nowIso();
  const batchResult = await env.DB.batch([
    update(timestamp),
    auditStatement(
      env,
      actor,
      input.requestId,
      action,
      "student",
      input.id,
      before.revision,
      before.revision + 1,
      timestamp
    ),
    bumpAppStateStatement(
      env,
      timestamp,
      "student",
      input.id,
      before.revision + 1,
      input.requestId
    )
  ]);
  if ((batchResult[0]?.meta.changes ?? 0) !== 1) {
    const current = await loadStudent(env, input.id);
    if (current === null) {
      throw new HttpError(404, "student_not_found", "\u5BFE\u8C61\u306E\u540D\u5B57\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    }
    assertExpectedRevision(current, input.expectedRevision);
    throw new HttpError(409, "mutation_not_applied", "\u4FDD\u5B58\u7AF6\u5408\u306E\u305F\u3081\u66F4\u65B0\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  const updated = await loadStudent(env, input.id);
  if (updated === null) {
    throw new HttpError(500, "mutation_result_missing", "\u4FDD\u5B58\u7D50\u679C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
  }
  return mapStudent(updated);
}
__name(executeStudentMutation, "executeStudentMutation");
__name2(executeStudentMutation, "executeStudentMutation");
async function updateFurigana(env, actor, input) {
  const value = input.furigana ?? "";
  const current = await loadStudent(env, input.id);
  if (current === null) {
    throw new HttpError(404, "student_not_found", "\u5BFE\u8C61\u306E\u540D\u5B57\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (current.furigana === value) {
    return mapStudent(current);
  }
  return executeStudentMutation(
    env,
    actor,
    input,
    "furigana.update",
    (timestamp) => env.DB.prepare(
      `UPDATE students
          SET furigana = ?1,
              revision = revision + 1,
              last_mutation_id = ?2,
              updated_at = ?3
        WHERE id = ?4 AND revision = ?5`
    ).bind(value, input.requestId, timestamp, input.id, input.expectedRevision)
  );
}
__name(updateFurigana, "updateFurigana");
__name2(updateFurigana, "updateFurigana");
async function updatePrivateMemo(env, actor, input) {
  const value = input.privateMemo ?? "";
  const current = await loadStudent(env, input.id);
  if (current === null) {
    throw new HttpError(404, "student_not_found", "\u5BFE\u8C61\u306E\u540D\u5B57\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (current.private_memo === value) {
    return mapStudent(current);
  }
  return executeStudentMutation(
    env,
    actor,
    input,
    "private-memo.update",
    (timestamp) => env.DB.prepare(
      `UPDATE students
          SET private_memo = ?1,
              revision = revision + 1,
              last_mutation_id = ?2,
              updated_at = ?3
        WHERE id = ?4 AND revision = ?5`
    ).bind(value, input.requestId, timestamp, input.id, input.expectedRevision)
  );
}
__name(updatePrivateMemo, "updatePrivateMemo");
__name2(updatePrivateMemo, "updatePrivateMemo");
function chunks(items, size) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}
__name(chunks, "chunks");
__name2(chunks, "chunks");
function studentUpsertStatements(env, input, timestamp) {
  return chunks(input.students, 20).map((group) => {
    const bindings = [];
    const values = group.map((student, rowIndex) => {
      const offset = rowIndex * 5;
      bindings.push(
        student.id,
        student.familyName,
        student.initialFurigana,
        student.initialPrivateMemo,
        timestamp
      );
      return `(?${offset + 1}, ?${offset + 2}, ?${offset + 3}, ?${offset + 4}, 1, NULL, ?${offset + 5}, ?${offset + 5})`;
    });
    return env.DB.prepare(
      `INSERT INTO students (
         id, family_name, furigana, private_memo, revision,
         last_mutation_id, created_at, updated_at
       ) VALUES ${values.join(", ")}
       ON CONFLICT(id) DO NOTHING`
    ).bind(...bindings);
  });
}
__name(studentUpsertStatements, "studentUpsertStatements");
__name2(studentUpsertStatements, "studentUpsertStatements");
function lessonUpsertStatements(env, input, timestamp) {
  return chunks(input.lessons, 7).map((group) => {
    const bindings = [];
    const values = group.map((lesson, rowIndex) => {
      const offset = rowIndex * 13;
      bindings.push(
        lesson.id,
        lesson.sourceKey,
        lesson.studentId,
        lesson.date,
        lesson.start,
        lesson.end,
        lesson.sessionNumber,
        input.weekStart,
        input.weekEnd,
        lesson.initialMemo,
        lesson.initialStatus,
        lesson.initialPastedAt,
        timestamp
      );
      return `(
        ?${offset + 1}, ?${offset + 2}, ?${offset + 3}, ?${offset + 4},
        ?${offset + 5}, ?${offset + 6}, ?${offset + 7}, ?${offset + 8},
        ?${offset + 9}, ?${offset + 10}, ?${offset + 11}, ?${offset + 12},
        CASE WHEN trim(?${offset + 10}) = '' THEN NULL ELSE ?${offset + 13} END,
        ?${offset + 4}, ?${offset + 5}, ?${offset + 6}, NULL, 1, 0, 1, NULL,
        ?${offset + 13}, ?${offset + 13}
      )`;
    });
    return env.DB.prepare(
      `INSERT INTO lessons (
         id, source_key, student_id, lesson_date, start_time, end_time,
         session_number, week_start, week_end, memo, status, pasted_at,
         memo_updated_at, memo_date, memo_start, memo_end,
         memo_schedule_updated_at, calendar_active, suppressed, revision,
         last_mutation_id, created_at, updated_at
       ) VALUES ${values.join(", ")}
       ON CONFLICT(id) DO UPDATE SET
         source_key = excluded.source_key,
         student_id = excluded.student_id,
         lesson_date = excluded.lesson_date,
         start_time = excluded.start_time,
         end_time = excluded.end_time,
         session_number = excluded.session_number,
         week_start = excluded.week_start,
         week_end = excluded.week_end,
         memo_date = excluded.lesson_date,
         memo_start = excluded.start_time,
         memo_end = excluded.end_time,
         memo_schedule_updated_at = NULL,
         calendar_active = 1,
         suppressed = 0,
         revision = lessons.revision + 1,
         last_mutation_id = NULL,
         updated_at = excluded.updated_at`
    ).bind(...bindings);
  });
}
__name(lessonUpsertStatements, "lessonUpsertStatements");
__name2(lessonUpsertStatements, "lessonUpsertStatements");
async function existingStudents(env, ids) {
  const result = /* @__PURE__ */ new Map();
  for (const group of chunks(ids, 80)) {
    if (group.length === 0) continue;
    const placeholders = group.map((_, index) => `?${index + 1}`).join(",");
    const rows = await env.DB.prepare(
      `SELECT id, family_name, furigana, private_memo, revision, last_mutation_id,
              created_at, updated_at
         FROM students WHERE id IN (${placeholders})`
    ).bind(...group).all();
    for (const row of rows.results) result.set(row.id, row);
  }
  return result;
}
__name(existingStudents, "existingStudents");
__name2(existingStudents, "existingStudents");
async function existingLessons(env, ids, sourceKeys) {
  const byId = /* @__PURE__ */ new Map();
  const bySource = /* @__PURE__ */ new Map();
  for (const [column, values] of [
    ["l.id", ids],
    ["l.source_key", sourceKeys]
  ]) {
    for (const group of chunks(values, 80)) {
      if (group.length === 0) continue;
      const placeholders = group.map((_, index) => `?${index + 1}`).join(",");
      const rows = await env.DB.prepare(`${LESSON_SELECT} WHERE ${column} IN (${placeholders})`).bind(...group).all();
      for (const row of rows.results) {
        byId.set(row.id, row);
        bySource.set(row.source_key, row);
      }
    }
  }
  return { byId, bySource };
}
__name(existingLessons, "existingLessons");
__name2(existingLessons, "existingLessons");
async function syncWeek(env, actor, input) {
  const priorRun = await env.DB.prepare(
    `SELECT response_json FROM sync_runs WHERE request_id = ?1`
  ).bind(input.requestId).first();
  if (priorRun !== null) {
    return JSON.parse(priorRun.response_json);
  }
  const studentsBefore = await existingStudents(
    env,
    input.students.map((student) => student.id)
  );
  for (const student of input.students) {
    const current = studentsBefore.get(student.id);
    if (current !== void 0 && current.family_name !== student.familyName) {
      throw new HttpError(
        409,
        "student_identity_conflict",
        "\u533F\u540D\u751F\u5F92ID\u3068\u540D\u5B57\u306E\u5BFE\u5FDC\u304C\u65E2\u5B58\u30C7\u30FC\u30BF\u3068\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002\u540C\u671F\u3092\u505C\u6B62\u3057\u307E\u3057\u305F\u3002"
      );
    }
  }
  const lessonsBefore = await existingLessons(
    env,
    input.lessons.map((lesson) => lesson.id),
    input.lessons.map((lesson) => lesson.sourceKey)
  );
  for (const lesson of input.lessons) {
    const byId = lessonsBefore.byId.get(lesson.id);
    const bySource = lessonsBefore.bySource.get(lesson.sourceKey);
    if (byId !== void 0 && byId.source_key !== lesson.sourceKey || bySource !== void 0 && bySource.id !== lesson.id) {
      throw new HttpError(
        409,
        "lesson_identity_conflict",
        "\u533F\u540D\u4E88\u5B9AID\u306E\u5BFE\u5FDC\u304C\u65E2\u5B58\u30C7\u30FC\u30BF\u3068\u4E00\u81F4\u3057\u307E\u305B\u3093\u3002\u540C\u671F\u3092\u505C\u6B62\u3057\u307E\u3057\u305F\u3002"
      );
    }
  }
  const timestamp = nowIso();
  const added = input.lessons.filter((lesson) => !lessonsBefore.byId.has(lesson.id)).length;
  const response = {
    ok: true,
    privacyMode: "family-name-only-v1",
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    activeLessons: input.lessons.length,
    added,
    updated: input.lessons.length - added,
    completedAt: timestamp
  };
  const statements = [
    env.DB.prepare(
      `UPDATE lessons
          SET calendar_active = CASE
                WHEN status = 'ready' AND trim(memo) <> '' AND suppressed = 0 THEN 1
                ELSE 0
              END,
              revision = revision + 1,
              last_mutation_id = NULL,
              updated_at = ?1
        WHERE week_start = ?2`
    ).bind(timestamp, input.weekStart)
  ];
  statements.push(...studentUpsertStatements(env, input, timestamp));
  statements.push(...lessonUpsertStatements(env, input, timestamp));
  statements.push(
    env.DB.prepare(
      `UPDATE app_state
          SET active_week_start = ?1,
              active_week_end = ?2,
              prepared_range_start = ?3,
              prepared_range_end = ?4,
              prepared_at = ?5,
              revision = revision + 1,
              updated_at = ?5
        WHERE singleton = 1`
    ).bind(
      input.weekStart,
      input.weekEnd,
      input.rangeStart,
      input.rangeEnd,
      timestamp
    ),
    env.DB.prepare(
      `INSERT INTO audit_events (
         occurred_at, request_id, actor_hash, actor_type, action,
         entity_type, entity_id, old_revision, new_revision, metadata_json
       ) VALUES (?1, ?2, ?3, ?4, 'week.sync', 'week', ?5, NULL, NULL, ?6)`
    ).bind(
      timestamp,
      input.requestId,
      actor.hash,
      actor.kind,
      input.weekStart,
      JSON.stringify({ lessons: input.lessons.length, students: input.students.length })
    ),
    env.DB.prepare(
      `INSERT INTO sync_runs (request_id, actor_hash, completed_at, response_json)
       VALUES (?1, ?2, ?3, ?4)`
    ).bind(input.requestId, actor.hash, timestamp, JSON.stringify(response)),
    env.DB.prepare(`DELETE FROM audit_events WHERE occurred_at < datetime('now', '-180 days')`),
    env.DB.prepare(`DELETE FROM sync_runs WHERE completed_at < datetime('now', '-30 days')`)
  );
  try {
    await env.DB.batch(statements);
  } catch (error) {
    const racedRun = await env.DB.prepare(
      `SELECT response_json FROM sync_runs WHERE request_id = ?1`
    ).bind(input.requestId).first();
    if (racedRun !== null) {
      return JSON.parse(racedRun.response_json);
    }
    throw error;
  }
  return response;
}
__name(syncWeek, "syncWeek");
__name2(syncWeek, "syncWeek");
async function getReadyLessons(env, preparedView) {
  const state = await loadAppState(env);
  const start = preparedView ? state.prepared_range_start : state.active_week_start;
  const end = preparedView ? state.prepared_range_end : state.active_week_end;
  if (!start || !end) {
    return [];
  }
  const rows = await env.DB.prepare(
    `${LESSON_SELECT}
      WHERE l.lesson_date BETWEEN ?1 AND ?2
        AND l.calendar_active = 1
        AND l.suppressed = 0
        AND l.status = 'ready'
        AND trim(l.memo) <> ''
      ORDER BY l.lesson_date ASC, l.start_time ASC, l.id ASC
      LIMIT 200`
  ).bind(start, end).all();
  const studentRows = await env.DB.prepare(
    `SELECT id, family_name, furigana, private_memo, revision, last_mutation_id,
            created_at, updated_at FROM students`
  ).all();
  const furigana = new Map(studentRows.results.map((student) => [student.id, student.furigana]));
  return rows.results.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.family_name,
    familyName: row.family_name,
    furigana: furigana.get(row.student_id) || null,
    date: row.lesson_date,
    weekday: weekdayFor(row.lesson_date),
    start: row.start_time,
    end: row.end_time,
    sessionNumber: row.session_number,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    memo: row.memo,
    status: row.status,
    revision: row.revision
  }));
}
__name(getReadyLessons, "getReadyLessons");
__name2(getReadyLessons, "getReadyLessons");
async function markPasted(env, actor, input) {
  const requestedIds = input.lessons.map((lesson) => lesson.id);
  const beforeRows = await existingLessons(env, requestedIds, []);
  const alreadyMarked = [];
  const conflicts = [];
  const statements = [];
  const timestamp = nowIso();
  for (const lesson of input.lessons) {
    const current = beforeRows.byId.get(lesson.id);
    if (current === void 0) {
      throw new HttpError(404, "lesson_not_found", "\u5BFE\u8C61\u306E\u6388\u696D\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
    }
    if (!current.memo.trim()) {
      throw new HttpError(400, "memo_required", "\u30E1\u30E2\u304C\u7A7A\u306E\u6388\u696D\u306F\u5831\u544A\u6E08\u307F\u306B\u3067\u304D\u307E\u305B\u3093\u3002");
    }
    if (current.status === "pasted") {
      alreadyMarked.push(lesson.id);
      continue;
    }
    if (current.revision !== lesson.expectedRevision) {
      conflicts.push(lesson.id);
      continue;
    }
    statements.push(
      env.DB.prepare(
        `UPDATE lessons
            SET status = 'pasted',
                pasted_at = ?1,
                revision = revision + 1,
                last_mutation_id = ?2,
                updated_at = ?1
          WHERE id = ?3 AND revision = ?4 AND trim(memo) <> ''`
      ).bind(timestamp, input.requestId, lesson.id, lesson.expectedRevision),
      auditStatement(
        env,
        actor,
        input.requestId,
        "report-status.bulk-pasted",
        "lesson",
        lesson.id,
        lesson.expectedRevision,
        lesson.expectedRevision + 1,
        timestamp
      )
    );
  }
  if (statements.length > 0) {
    statements.push(
      env.DB.prepare(
        `UPDATE app_state
            SET revision = revision + 1, updated_at = ?1
          WHERE singleton = 1
            AND EXISTS (
              SELECT 1 FROM lessons WHERE last_mutation_id = ?2
            )`
      ).bind(timestamp, input.requestId)
    );
    await env.DB.batch(statements);
  }
  const afterRows = await existingLessons(env, requestedIds, []);
  const marked = [...alreadyMarked];
  for (const lesson of input.lessons) {
    const current = afterRows.byId.get(lesson.id);
    if (current?.status === "pasted" && (current.last_mutation_id === input.requestId || alreadyMarked.includes(lesson.id))) {
      if (!marked.includes(lesson.id)) marked.push(lesson.id);
    } else if (!conflicts.includes(lesson.id)) {
      conflicts.push(lesson.id);
    }
  }
  return { marked, conflicts, completedAt: timestamp };
}
__name(markPasted, "markPasted");
__name2(markPasted, "markPasted");
var ID_PATTERN = /^[a-z][a-z0-9_-]{17,79}$/;
var SOURCE_KEY_PATTERN = /^src_[a-f0-9]{64}$/;
var REQUEST_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{15,79}$/;
var DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
var TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
var FAMILY_NAME_PATTERN = /^[\p{L}\p{M}々〆ヶヵ・'’\-]+$/u;
var FURIGANA_PATTERN = /^[ぁ-ゖゝゞー]+$/u;
var FORBIDDEN_KEYS = /* @__PURE__ */ new Set([
  "fullname",
  "givenname",
  "firstname",
  "lastname",
  "studentname",
  "displayname",
  "aliases",
  "calendartitle",
  "calendareventid",
  "calendarid",
  "attendees",
  "email",
  "description"
]);
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
__name(isRecord, "isRecord");
__name2(isRecord, "isRecord");
function requireRecord(value, path, allowedKeys, requiredKeys) {
  if (!isRecord(value)) {
    throw new HttpError(400, "invalid_input", `${path}\u306FJSON\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
  }
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new HttpError(400, "unexpected_field", `${path}.${key}\u306F\u53D7\u3051\u4ED8\u3051\u307E\u305B\u3093\u3002`);
    }
  }
  for (const key of requiredKeys) {
    if (!(key in value)) {
      throw new HttpError(400, "missing_field", `${path}.${key}\u304C\u3042\u308A\u307E\u305B\u3093\u3002`);
    }
  }
  return value;
}
__name(requireRecord, "requireRecord");
__name2(requireRecord, "requireRecord");
function scanForbiddenKeys(value, path = "payload", depth = 0) {
  if (depth > 8) {
    throw new HttpError(400, "input_too_deep", "\u540C\u671F\u30C7\u30FC\u30BF\u306E\u5165\u308C\u5B50\u304C\u6DF1\u3059\u304E\u307E\u3059\u3002");
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      scanForbiddenKeys(item, `${path}[${index}]`, depth + 1);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      throw new HttpError(
        400,
        "privacy_field_rejected",
        `${path}.${key}\u306F\u540D\u5B57\u9650\u5B9A\u30E2\u30FC\u30C9\u3067\u306F\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3002`
      );
    }
    scanForbiddenKeys(child, `${path}.${key}`, depth + 1);
  }
}
__name(scanForbiddenKeys, "scanForbiddenKeys");
__name2(scanForbiddenKeys, "scanForbiddenKeys");
function requireString(value, path, maximumLength) {
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_input", `${path}\u306F\u6587\u5B57\u5217\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
  }
  const normalized = value.normalize("NFC").replace(/\r\n?/g, "\n");
  if (normalized.length > maximumLength) {
    throw new HttpError(400, "input_too_long", `${path}\u304C\u9577\u3059\u304E\u307E\u3059\u3002`);
  }
  if (normalized.includes("\0")) {
    throw new HttpError(400, "invalid_input", `${path}\u306B\u4F7F\u7528\u3067\u304D\u306A\u3044\u6587\u5B57\u304C\u3042\u308A\u307E\u3059\u3002`);
  }
  return normalized;
}
__name(requireString, "requireString");
__name2(requireString, "requireString");
function requireId(value, path) {
  const id = requireString(value, path, 80);
  if (!ID_PATTERN.test(id)) {
    throw new HttpError(400, "invalid_id", `${path}\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  return id;
}
__name(requireId, "requireId");
__name2(requireId, "requireId");
function requireRequestId(value, path = "requestId") {
  const id = requireString(value, path, 80);
  if (!REQUEST_ID_PATTERN.test(id)) {
    throw new HttpError(400, "invalid_request_id", `${path}\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  return id;
}
__name(requireRequestId, "requireRequestId");
__name2(requireRequestId, "requireRequestId");
function requireRevision(value, path) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
    throw new HttpError(400, "invalid_revision", `${path}\u306E\u7248\u756A\u53F7\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  return value;
}
__name(requireRevision, "requireRevision");
__name2(requireRevision, "requireRevision");
function requireDate(value, path) {
  const candidate = requireString(value, path, 10);
  if (!DATE_PATTERN.test(candidate)) {
    throw new HttpError(400, "invalid_date", `${path}\u306FYYYY-MM-DD\u5F62\u5F0F\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
  }
  const parsed = /* @__PURE__ */ new Date(`${candidate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate) {
    throw new HttpError(400, "invalid_date", `${path}\u306E\u65E5\u4ED8\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  return candidate;
}
__name(requireDate, "requireDate");
__name2(requireDate, "requireDate");
function requireTime(value, path, optional) {
  if (optional && (value === null || value === "")) {
    return null;
  }
  const candidate = requireString(value, path, 5);
  if (!TIME_PATTERN.test(candidate)) {
    throw new HttpError(400, "invalid_time", `${path}\u306FHH:MM\u5F62\u5F0F\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
  }
  return candidate;
}
__name(requireTime, "requireTime");
__name2(requireTime, "requireTime");
function requireTimestamp(value, path, optional) {
  if (optional && (value === null || value === "")) {
    return null;
  }
  const candidate = requireString(value, path, 64);
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "invalid_timestamp", `${path}\u306E\u65E5\u6642\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  return parsed.toISOString();
}
__name(requireTimestamp, "requireTimestamp");
__name2(requireTimestamp, "requireTimestamp");
function requireFamilyName(value, path) {
  const candidate = requireString(value, path, 32).trim();
  if (candidate.length < 1 || /\s/u.test(candidate) || !FAMILY_NAME_PATTERN.test(candidate)) {
    throw new HttpError(400, "family_name_only", `${path}\u306F\u540D\u5B57\u3060\u3051\u3092\u7A7A\u767D\u306A\u3057\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
  }
  return candidate;
}
__name(requireFamilyName, "requireFamilyName");
__name2(requireFamilyName, "requireFamilyName");
function requireFurigana(value, path) {
  const candidate = requireString(value, path, 64).trim();
  if (candidate && !FURIGANA_PATTERN.test(candidate)) {
    throw new HttpError(400, "family_furigana_only", `${path}\u306F\u540D\u5B57\u306E\u8AAD\u307F\u3060\u3051\u3092\u3001\u3072\u3089\u304C\u306A\u30FB\u7A7A\u767D\u306A\u3057\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002`);
  }
  return candidate;
}
__name(requireFurigana, "requireFurigana");
__name2(requireFurigana, "requireFurigana");
function dayDifference(start, end) {
  return Math.round(
    (Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / 864e5
  );
}
__name(dayDifference, "dayDifference");
__name2(dayDifference, "dayDifference");
function parseSyncWeek(value) {
  scanForbiddenKeys(value);
  const payload = requireRecord(
    value,
    "payload",
    [
      "protocolVersion",
      "privacyMode",
      "requestId",
      "weekStart",
      "weekEnd",
      "rangeStart",
      "rangeEnd",
      "students",
      "lessons"
    ],
    [
      "protocolVersion",
      "privacyMode",
      "requestId",
      "weekStart",
      "weekEnd",
      "rangeStart",
      "rangeEnd",
      "students",
      "lessons"
    ]
  );
  if (payload.protocolVersion !== 1 || payload.privacyMode !== "family-name-only-v1") {
    throw new HttpError(400, "privacy_protocol_required", "\u540D\u5B57\u9650\u5B9A\u540C\u671F\u30D7\u30ED\u30C8\u30B3\u30EB\u304C\u5FC5\u8981\u3067\u3059\u3002");
  }
  const requestId = requireRequestId(payload.requestId);
  const weekStart = requireDate(payload.weekStart, "weekStart");
  const weekEnd = requireDate(payload.weekEnd, "weekEnd");
  const rangeStart = requireDate(payload.rangeStart, "rangeStart");
  const rangeEnd = requireDate(payload.rangeEnd, "rangeEnd");
  if ((/* @__PURE__ */ new Date(`${weekStart}T00:00:00Z`)).getUTCDay() !== 0 || dayDifference(weekStart, weekEnd) !== 6) {
    throw new HttpError(400, "invalid_week", "\u5BFE\u8C61\u9031\u306F\u65E5\u66DC\u65E5\u304B\u3089\u571F\u66DC\u65E5\u307E\u3067\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  if (rangeStart > rangeEnd || dayDifference(rangeStart, rangeEnd) > 62) {
    throw new HttpError(400, "invalid_range", "\u6E96\u5099\u7BC4\u56F2\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  if (!Array.isArray(payload.students) || payload.students.length > 140) {
    throw new HttpError(400, "invalid_students", "\u751F\u5F92\u30C7\u30FC\u30BF\u306F140\u4EF6\u4EE5\u5185\u306E\u914D\u5217\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  if (!Array.isArray(payload.lessons) || payload.lessons.length > 140) {
    throw new HttpError(400, "invalid_lessons", "\u6388\u696D\u30C7\u30FC\u30BF\u306F140\u4EF6\u4EE5\u5185\u306E\u914D\u5217\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  let totalTextLength = 0;
  const studentIds = /* @__PURE__ */ new Set();
  const students = payload.students.map((raw, index) => {
    const item = requireRecord(
      raw,
      `students[${index}]`,
      ["id", "familyName", "initialFurigana", "initialPrivateMemo"],
      ["id", "familyName", "initialFurigana", "initialPrivateMemo"]
    );
    const id = requireId(item.id, `students[${index}].id`);
    if (studentIds.has(id)) {
      throw new HttpError(400, "duplicate_student", "\u540C\u3058\u751F\u5F92ID\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002");
    }
    studentIds.add(id);
    const initialPrivateMemo = requireString(
      item.initialPrivateMemo,
      `students[${index}].initialPrivateMemo`,
      2e4
    );
    totalTextLength += initialPrivateMemo.length;
    return {
      id,
      familyName: requireFamilyName(item.familyName, `students[${index}].familyName`),
      initialFurigana: requireFurigana(item.initialFurigana, `students[${index}].initialFurigana`),
      initialPrivateMemo
    };
  });
  const lessonIds = /* @__PURE__ */ new Set();
  const sourceKeys = /* @__PURE__ */ new Set();
  const lessons = payload.lessons.map((raw, index) => {
    const item = requireRecord(
      raw,
      `lessons[${index}]`,
      [
        "id",
        "sourceKey",
        "studentId",
        "date",
        "start",
        "end",
        "sessionNumber",
        "initialMemo",
        "initialStatus",
        "initialPastedAt"
      ],
      [
        "id",
        "sourceKey",
        "studentId",
        "date",
        "start",
        "end",
        "sessionNumber",
        "initialMemo",
        "initialStatus",
        "initialPastedAt"
      ]
    );
    const id = requireId(item.id, `lessons[${index}].id`);
    if (lessonIds.has(id)) {
      throw new HttpError(400, "duplicate_lesson", "\u540C\u3058\u6388\u696DID\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002");
    }
    lessonIds.add(id);
    const sourceKey = requireString(item.sourceKey, `lessons[${index}].sourceKey`, 68);
    if (!SOURCE_KEY_PATTERN.test(sourceKey) || sourceKeys.has(sourceKey)) {
      throw new HttpError(400, "invalid_source_key", "\u4E88\u5B9A\u306E\u533F\u540D\u8B58\u5225\u5B50\u304C\u4E0D\u6B63\u307E\u305F\u306F\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002");
    }
    sourceKeys.add(sourceKey);
    const studentId = requireId(item.studentId, `lessons[${index}].studentId`);
    if (!studentIds.has(studentId)) {
      throw new HttpError(400, "unknown_student", "\u6388\u696D\u304C\u672A\u767B\u9332\u306E\u751F\u5F92ID\u3092\u53C2\u7167\u3057\u3066\u3044\u307E\u3059\u3002");
    }
    const date = requireDate(item.date, `lessons[${index}].date`);
    if (date < weekStart || date > weekEnd) {
      throw new HttpError(400, "lesson_outside_week", "\u5BFE\u8C61\u9031\u306E\u5916\u306B\u3042\u308B\u6388\u696D\u306F\u540C\u671F\u3067\u304D\u307E\u305B\u3093\u3002");
    }
    let sessionNumber = null;
    if (item.sessionNumber !== null) {
      if (!Number.isSafeInteger(item.sessionNumber) || item.sessionNumber < 1 || item.sessionNumber > 1e3) {
        throw new HttpError(400, "invalid_session_number", "\u6388\u696D\u56DE\u6570\u304C\u4E0D\u6B63\u3067\u3059\u3002");
      }
      sessionNumber = item.sessionNumber;
    }
    if (item.initialStatus !== "empty" && item.initialStatus !== "ready" && item.initialStatus !== "pasted") {
      throw new HttpError(400, "invalid_status", "\u5831\u544A\u72B6\u614B\u304C\u4E0D\u6B63\u3067\u3059\u3002");
    }
    const initialMemo = requireString(item.initialMemo, `lessons[${index}].initialMemo`, 2e4);
    if (item.initialStatus !== "empty" && !initialMemo.trim()) {
      throw new HttpError(400, "invalid_status", "\u30E1\u30E2\u304C\u7A7A\u306E\u6388\u696D\u3092\u5831\u544A\u5F85\u3061\u30FB\u5831\u544A\u6E08\u307F\u306B\u306F\u3067\u304D\u307E\u305B\u3093\u3002");
    }
    totalTextLength += initialMemo.length;
    return {
      id,
      sourceKey,
      studentId,
      date,
      start: requireTime(item.start, `lessons[${index}].start`, false),
      end: requireTime(item.end, `lessons[${index}].end`, true),
      sessionNumber,
      initialMemo,
      initialStatus: item.initialStatus,
      initialPastedAt: requireTimestamp(
        item.initialPastedAt,
        `lessons[${index}].initialPastedAt`,
        true
      )
    };
  });
  if (totalTextLength > 3e5) {
    throw new HttpError(413, "sync_text_too_large", "\u540C\u671F\u3059\u308B\u30E1\u30E2\u672C\u6587\u306E\u5408\u8A08\u304C\u5927\u304D\u3059\u304E\u307E\u3059\u3002");
  }
  return {
    protocolVersion: 1,
    privacyMode: "family-name-only-v1",
    requestId,
    weekStart,
    weekEnd,
    rangeStart,
    rangeEnd,
    students,
    lessons
  };
}
__name(parseSyncWeek, "parseSyncWeek");
__name2(parseSyncWeek, "parseSyncWeek");
function parseBaseMutation(value, allowedKeys, requiredKeys) {
  const payload = requireRecord(value, "payload", allowedKeys, requiredKeys);
  return {
    payload,
    base: {
      id: requireId(payload.id, "id"),
      expectedRevision: requireRevision(payload.expectedRevision, "expectedRevision"),
      requestId: requireRequestId(payload.requestId)
    }
  };
}
__name(parseBaseMutation, "parseBaseMutation");
__name2(parseBaseMutation, "parseBaseMutation");
function parseMemoMutation(value) {
  const { payload, base } = parseBaseMutation(
    value,
    ["id", "expectedRevision", "requestId", "memo"],
    ["id", "expectedRevision", "requestId", "memo"]
  );
  return { ...base, memo: requireString(payload.memo, "memo", 2e4) };
}
__name(parseMemoMutation, "parseMemoMutation");
__name2(parseMemoMutation, "parseMemoMutation");
function parseDeleteMutation(value) {
  return parseBaseMutation(
    value,
    ["id", "expectedRevision", "requestId"],
    ["id", "expectedRevision", "requestId"]
  ).base;
}
__name(parseDeleteMutation, "parseDeleteMutation");
__name2(parseDeleteMutation, "parseDeleteMutation");
function parseScheduleMutation(value) {
  const { payload, base } = parseBaseMutation(
    value,
    ["id", "expectedRevision", "requestId", "memoDate", "memoStart", "memoEnd"],
    ["id", "expectedRevision", "requestId", "memoDate", "memoStart", "memoEnd"]
  );
  return {
    ...base,
    memoDate: requireDate(payload.memoDate, "memoDate"),
    memoStart: requireTime(payload.memoStart, "memoStart", false),
    memoEnd: requireTime(payload.memoEnd, "memoEnd", true)
  };
}
__name(parseScheduleMutation, "parseScheduleMutation");
__name2(parseScheduleMutation, "parseScheduleMutation");
function parseReportStatusMutation(value) {
  const { payload, base } = parseBaseMutation(
    value,
    ["id", "expectedRevision", "requestId", "status"],
    ["id", "expectedRevision", "requestId", "status"]
  );
  if (payload.status !== "ready" && payload.status !== "pasted") {
    throw new HttpError(400, "invalid_status", "\u5831\u544A\u72B6\u614B\u304C\u4E0D\u6B63\u3067\u3059\u3002");
  }
  return { ...base, status: payload.status };
}
__name(parseReportStatusMutation, "parseReportStatusMutation");
__name2(parseReportStatusMutation, "parseReportStatusMutation");
function parseFuriganaMutation(value) {
  const { payload, base } = parseBaseMutation(
    value,
    ["id", "expectedRevision", "requestId", "furigana"],
    ["id", "expectedRevision", "requestId", "furigana"]
  );
  return { ...base, furigana: requireFurigana(payload.furigana, "furigana") };
}
__name(parseFuriganaMutation, "parseFuriganaMutation");
__name2(parseFuriganaMutation, "parseFuriganaMutation");
function parsePrivateMemoMutation(value) {
  const { payload, base } = parseBaseMutation(
    value,
    ["id", "expectedRevision", "requestId", "privateMemo"],
    ["id", "expectedRevision", "requestId", "privateMemo"]
  );
  return { ...base, privateMemo: requireString(payload.privateMemo, "privateMemo", 2e4) };
}
__name(parsePrivateMemoMutation, "parsePrivateMemoMutation");
__name2(parsePrivateMemoMutation, "parsePrivateMemoMutation");
function parseMarkPasted(value) {
  const payload = requireRecord(
    value,
    "payload",
    ["requestId", "lessons"],
    ["requestId", "lessons"]
  );
  if (!Array.isArray(payload.lessons) || payload.lessons.length < 1 || payload.lessons.length > 20) {
    throw new HttpError(400, "invalid_lessons", "\u5831\u544A\u6E08\u307F\u306B\u3059\u308B\u6388\u696D\u30921\u301C20\u4EF6\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  const ids = /* @__PURE__ */ new Set();
  const lessons = payload.lessons.map((raw, index) => {
    const item = requireRecord(
      raw,
      `lessons[${index}]`,
      ["id", "expectedRevision"],
      ["id", "expectedRevision"]
    );
    const id = requireId(item.id, `lessons[${index}].id`);
    if (ids.has(id)) {
      throw new HttpError(400, "duplicate_lesson", "\u540C\u3058\u6388\u696DID\u304C\u91CD\u8907\u3057\u3066\u3044\u307E\u3059\u3002");
    }
    ids.add(id);
    return {
      id,
      expectedRevision: requireRevision(item.expectedRevision, `lessons[${index}].expectedRevision`)
    };
  });
  return { requestId: requireRequestId(payload.requestId), lessons };
}
__name(parseMarkPasted, "parseMarkPasted");
__name2(parseMarkPasted, "parseMarkPasted");
var APP_ID = "jp.orio.tg-lesson-memo.cloud";
function isAutomationPath(pathname) {
  return pathname.startsWith("/api/automation/");
}
__name(isAutomationPath, "isAutomationPath");
__name2(isAutomationPath, "isAutomationPath");
async function handleApi(request, env, actor, pathname) {
  if (request.method === "GET" && pathname === "/api/state") {
    return jsonResponse(await getState(env));
  }
  if (request.method === "GET" && pathname === "/api/session") {
    return jsonResponse({
      ok: true,
      appId: APP_ID,
      version: env.APP_VERSION,
      privacyMode: "family-name-only-v1",
      actorType: actor.kind
    });
  }
  if (request.method === "GET" && pathname === "/api/automation/state") {
    return jsonResponse(await getState(env));
  }
  if (request.method === "GET" && pathname === "/api/automation/ready") {
    const preparedView = new URL(request.url).searchParams.get("preparedView") === "1";
    return jsonResponse(await getReadyLessons(env, preparedView));
  }
  if (request.method !== "POST") {
    throw new HttpError(404, "not_found", "API\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
  if (actor.kind !== "automation") {
    assertSameOriginMutation(request);
  }
  const body = await readJsonBody(request);
  switch (pathname) {
    case "/api/memo":
      return jsonResponse({ lesson: await updateMemo(env, actor, parseMemoMutation(body)) });
    case "/api/delete-lesson":
      return jsonResponse({ lesson: await deleteLesson(env, actor, parseDeleteMutation(body)) });
    case "/api/memo-schedule":
      return jsonResponse({ lesson: await updateSchedule(env, actor, parseScheduleMutation(body)) });
    case "/api/furigana":
      return jsonResponse({ student: await updateFurigana(env, actor, parseFuriganaMutation(body)) });
    case "/api/private-memo":
      return jsonResponse({
        student: await updatePrivateMemo(env, actor, parsePrivateMemoMutation(body))
      });
    case "/api/report-status":
      return jsonResponse({
        lesson: await updateReportStatus(env, actor, parseReportStatusMutation(body))
      });
    case "/api/automation/sync-week":
      return jsonResponse(await syncWeek(env, actor, parseSyncWeek(body)));
    case "/api/automation/mark-pasted":
      return jsonResponse(await markPasted(env, actor, parseMarkPasted(body)));
    default:
      throw new HttpError(404, "not_found", "API\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
  }
}
__name(handleApi, "handleApi");
__name2(handleApi, "handleApi");
var index_default = {
  async fetch(request, env, execution) {
    const requestId = newRequestId();
    const startedAt = Date.now();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const isApi = pathname.startsWith("/api/");
    let actorKind = "unauthenticated";
    let response;
    try {
      if (request.method === "GET" && pathname === "/api/health") {
        response = jsonResponse({
          ok: true,
          appId: APP_ID,
          version: env.APP_VERSION,
          privacyMode: "family-name-only-v1"
        });
      } else {
        const actor = await authenticate(
          request,
          env,
          execution,
          isAutomationPath(pathname)
        );
        actorKind = actor.kind;
        if (isApi) {
          response = await handleApi(request, env, actor, pathname);
        } else if (request.method === "GET" || request.method === "HEAD") {
          const assetRequest = pathname === "/" ? new Request(new URL("/index.html", request.url), request) : request;
          response = await env.ASSETS.fetch(assetRequest);
          if (response.status === 404) {
            throw new HttpError(404, "not_found", "\u30DA\u30FC\u30B8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002");
          }
        } else {
          throw new HttpError(405, "method_not_allowed", "\u3053\u306E\u64CD\u4F5C\u306F\u8A31\u53EF\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002");
        }
      }
    } catch (error) {
      response = errorResponse(error);
      if (!(error instanceof HttpError)) {
        console.error(
          JSON.stringify({
            event: "request_error",
            requestId,
            path: pathname,
            errorType: error instanceof Error ? error.name : typeof error
          })
        );
      }
    }
    const secured = applySecurityHeaders(response, env, requestId, isApi);
    console.log(
      JSON.stringify({
        event: "request_complete",
        requestId,
        method: request.method,
        path: pathname,
        status: secured.status,
        actorType: actorKind,
        durationMs: Date.now() - startedAt
      })
    );
    return secured;
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
