import fs from "node:fs";

const sourcePath = "cloudflare-inspect/worker-current.js";
const outputPath = "cloudflare-patch/worker-patched.js";
let source = fs.readFileSync(sourcePath, "utf8");
const backendFunctions = fs.readFileSync("cloudflare-patch/student-profile-backend.jsfrag", "utf8");
const html = fs.readFileSync("cloudflare-patch/student-info.html", "utf8");
const css = fs.readFileSync("cloudflare-patch/student-info.css", "utf8");
const clientJs = fs.readFileSync("cloudflare-patch/student-info.js", "utf8");

function replaceOnce(needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`Patch anchor not found: ${label}`);
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`Patch anchor is not unique: ${label}`);
  }
  source = source.slice(0, first) + replacement + source.slice(first + needle.length);
}

const backend =
  backendFunctions +
  "\nvar STUDENT_INFO_HTML = " + JSON.stringify(html) + ";" +
  "\nvar STUDENT_INFO_CSS = " + JSON.stringify(css) + ";" +
  "\nvar STUDENT_INFO_JS = " + JSON.stringify(clientJs) + ";\n";

replaceOnce(
  'var APP_ID = "jp.orio.tg-lesson-memo.cloud";',
  backend + '\nvar APP_ID = "jp.orio.tg-lesson-memo.cloud";',
  "backend insertion"
);

const handleAnchor = 'async function handleApi(request, env, actor, pathname) {\n';
const handleInsert = [
  'async function handleApi(request, env, actor, pathname) {',
  '  if (request.method === "GET" && pathname === "/api/student-profiles") {',
  '    return jsonResponse({ students: await listStudentProfiles(env) });',
  '  }',
  '  const profileMatch = /^\\/api\\/student-profiles\\/([a-z][a-z0-9_-]{17,79})$/.exec(pathname);',
  '  if (request.method === "PUT" && profileMatch !== null) {',
  '    if (actor.kind !== "browser") {',
  '      throw new HttpError(403, "profile_browser_only", "生徒情報は本人の画面からだけ更新できます。");',
  '    }',
  '    assertSameOriginMutation(request);',
  '    const body = await readJsonBody(request);',
  '    return jsonResponse({',
  '      student: await updateStudentProfile(env, actor, profileMatch[1], parseStudentProfileMutation(body))',
  '    });',
  '  }',
  ''
].join('\n');
replaceOnce(handleAnchor, handleInsert, "handleApi profile routes");

const fetchAnchor = [
  '        if (isApi) {',
  '          response = await handleApi(request, env, actor, pathname);',
  '        } else if (request.method === "GET" || request.method === "HEAD") {',
  '          const assetRequest = pathname === "/" ? new Request(new URL("/index.html", request.url), request) : request;',
  ''
].join('\n');
const fetchReplacement = [
  '        if (isApi) {',
  '          response = await handleApi(request, env, actor, pathname);',
  '        } else if ((request.method === "GET" || request.method === "HEAD") && pathname === "/student-info") {',
  '          response = staticStudentInfoResponse(STUDENT_INFO_HTML, "text/html; charset=utf-8", request.method);',
  '        } else if ((request.method === "GET" || request.method === "HEAD") && pathname === "/student-info.css") {',
  '          response = staticStudentInfoResponse(STUDENT_INFO_CSS, "text/css; charset=utf-8", request.method);',
  '        } else if ((request.method === "GET" || request.method === "HEAD") && pathname === "/student-info.js") {',
  '          response = staticStudentInfoResponse(STUDENT_INFO_JS, "application/javascript; charset=utf-8", request.method);',
  '        } else if (request.method === "GET" || request.method === "HEAD") {',
  '          const assetRequest = pathname === "/" ? new Request(new URL("/index.html", request.url), request) : request;',
  ''
].join('\n');
replaceOnce(fetchAnchor, fetchReplacement, "student info page routes");

const healthAnchor = [
  '      if (request.method === "GET" && pathname === "/api/health") {',
  '        response = jsonResponse({',
  '          ok: true,',
  '          appId: APP_ID,',
  '          version: env.APP_VERSION,',
  '          privacyMode: "family-name-only-v1"',
  '        });',
  ''
].join('\n');
const healthReplacement = [
  '      if (request.method === "GET" && pathname === "/api/health") {',
  '        response = jsonResponse({',
  '          ok: true,',
  '          appId: APP_ID,',
  '          version: env.APP_VERSION,',
  '          privacyMode: "family-name-only-v1",',
  '          studentProfiles: true',
  '        });',
  ''
].join('\n');
replaceOnce(healthAnchor, healthReplacement, "health feature flag");

const requiredMarkers = [
  'function authenticate',
  'env.ASSETS.fetch',
  'CREATE TABLE IF NOT EXISTS student_profiles',
  'pathname === "/api/student-profiles"',
  'pathname === "/student-info"',
  'studentProfiles: true',
  'assertSameOriginMutation(request)',
  'family-name-only-v1'
];
for (const marker of requiredMarkers) {
  if (!source.includes(marker)) throw new Error(`Required marker missing after patch: ${marker}`);
}

for (const forbidden of ['studentName:', 'fullName:', 'givenName:', 'email:']) {
  const backendStart = source.indexOf('var STUDENT_PROFILE_FIELD_LIMITS');
  const appIdStart = source.indexOf('var APP_ID = "jp.orio.tg-lesson-memo.cloud";');
  const inserted = source.slice(backendStart, appIdStart);
  if (inserted.includes(forbidden)) {
    throw new Error(`Forbidden identity field introduced in profile backend: ${forbidden}`);
  }
}

fs.writeFileSync(outputPath, source);
console.log(`Patched Worker written to ${outputPath} (${Buffer.byteLength(source)} bytes)`);
