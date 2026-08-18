import fs from "node:fs";

const sourcePath = "cloudflare-inspect/worker-current.js";
const outputPath = "cloudflare-patch/worker-patched.js";
let source = fs.readFileSync(sourcePath, "utf8");
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

const backend = String.raw`
var STUDENT_PROFILE_FIELD_LIMITS = {
  schoolGrade: 120,
  firstChoice: 240,
  otherChoices: 800,
  admissionType: 240,
  currentStatus: 1200,
  academicStatus: 1200,
  currentChallenge: 1200,
  teachingPolicy: 1600,
  nextAction: 1200,
  summary: 500,
  freeMemo: 5000
};
var STUDENT_PROFILE_FIELDS = Object.keys(STUDENT_PROFILE_FIELD_LIMITS);
function requireProfileText(value, field) {
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_profile_field", field + "は文字列で指定してください。");
  }
  const normalized = value.normalize("NFC").replace(/\r\n?/g, "\n").trim();
  if (normalized.length > STUDENT_PROFILE_FIELD_LIMITS[field]) {
    throw new HttpError(400, "profile_field_too_long", field + "が長すぎます。");
  }
  if (normalized.includes("\0")) {
    throw new HttpError(400, "invalid_profile_field", field + "に使用できない文字があります。");
  }
  return normalized;
}
function requireProfileRevision(value) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2147483647) {
    throw new HttpError(400, "invalid_profile_revision", "生徒情報の版番号が不正です。");
  }
  return value;
}
function parseStudentProfileMutation(value) {
  scanForbiddenKeys(value);
  const payload = requireRecord(
    value,
    "payload",
    ["expectedRevision", "requestId", "profile"],
    ["expectedRevision", "requestId", "profile"]
  );
  const profileObject = requireRecord(
    payload.profile,
    "profile",
    STUDENT_PROFILE_FIELDS,
    STUDENT_PROFILE_FIELDS
  );
  const profile = {};
  for (const field of STUDENT_PROFILE_FIELDS) {
    profile[field] = requireProfileText(profileObject[field], field);
  }
  return {
    expectedRevision: requireProfileRevision(payload.expectedRevision),
    requestId: requireRequestId(payload.requestId),
    profile
  };
}
async function ensureStudentProfileSchema(env) {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS student_profiles (
      student_id TEXT PRIMARY KEY,
      school_grade TEXT NOT NULL DEFAULT '',
      first_choice TEXT NOT NULL DEFAULT '',
      other_choices TEXT NOT NULL DEFAULT '',
      admission_type TEXT NOT NULL DEFAULT '',
      current_status TEXT NOT NULL DEFAULT '',
      academic_status TEXT NOT NULL DEFAULT '',
      current_challenge TEXT NOT NULL DEFAULT '',
      teaching_policy TEXT NOT NULL DEFAULT '',
      next_action TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      free_memo TEXT NOT NULL DEFAULT '',
      revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
      last_mutation_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`
  ).run();
}
function mapStudentProfile(row) {
  return {
    id: row.id,
    familyName: row.family_name,
    furigana: row.furigana || "",
    profile: {
      schoolGrade: row.school_grade || "",
      firstChoice: row.first_choice || "",
      otherChoices: row.other_choices || "",
      admissionType: row.admission_type || "",
      currentStatus: row.current_status || "",
      academicStatus: row.academic_status || "",
      currentChallenge: row.current_challenge || "",
      teachingPolicy: row.teaching_policy || "",
      nextAction: row.next_action || "",
      summary: row.summary || "",
      freeMemo: row.free_memo || ""
    },
    profileRevision: Number.isSafeInteger(row.profile_revision) ? row.profile_revision : 0,
    profileUpdatedAt: row.profile_updated_at || null
  };
}
var STUDENT_PROFILE_SELECT = `
  SELECT
    s.id,
    s.family_name,
    s.furigana,
    p.school_grade,
    p.first_choice,
    p.other_choices,
    p.admission_type,
    p.current_status,
    p.academic_status,
    p.current_challenge,
    p.teaching_policy,
    p.next_action,
    p.summary,
    p.free_memo,
    p.revision AS profile_revision,
    p.last_mutation_id AS profile_last_mutation_id,
    p.updated_at AS profile_updated_at
  FROM students AS s
  LEFT JOIN student_profiles AS p ON p.student_id = s.id
`;
async function listStudentProfiles(env) {
  await ensureStudentProfileSchema(env);
  const rows = await env.DB.prepare(
    STUDENT_PROFILE_SELECT + " ORDER BY s.family_name ASC, s.furigana ASC, s.id ASC LIMIT 500"
  ).all();
  return rows.results.map(mapStudentProfile);
}
async function loadStudentProfile(env, id) {
  return env.DB.prepare(STUDENT_PROFILE_SELECT + " WHERE s.id = ?1").bind(id).first();
}
function studentProfileAuditStatement(env, actor, requestId, studentId, oldRevision, newRevision, timestamp) {
  return env.DB.prepare(
    `INSERT INTO audit_events (
      occurred_at, request_id, actor_hash, actor_type, action,
      entity_type, entity_id, old_revision, new_revision, metadata_json
    )
    SELECT ?1, ?2, ?3, ?4, 'student-profile.update', 'student-profile', ?5, ?6, ?7, '{}'
    WHERE EXISTS (
      SELECT 1 FROM student_profiles
      WHERE student_id = ?5 AND revision = ?7 AND last_mutation_id = ?2
    )`
  ).bind(timestamp, requestId, actor.hash, actor.kind, studentId, oldRevision, newRevision);
}
function studentProfileAppStateStatement(env, timestamp, studentId, newRevision, requestId) {
  return env.DB.prepare(
    `UPDATE app_state
      SET revision = revision + 1, updated_at = ?1
      WHERE singleton = 1
        AND EXISTS (
          SELECT 1 FROM student_profiles
          WHERE student_id = ?2 AND revision = ?3 AND last_mutation_id = ?4
        )`
  ).bind(timestamp, studentId, newRevision, requestId);
}
async function updateStudentProfile(env, actor, idValue, input) {
  const id = requireId(idValue, "studentId");
  await ensureStudentProfileSchema(env);
  const student = await loadStudent(env, id);
  if (student === null) {
    throw new HttpError(404, "student_not_found", "対象の生徒が見つかりません。");
  }
  const before = await env.DB.prepare(
    "SELECT revision, last_mutation_id FROM student_profiles WHERE student_id = ?1"
  ).bind(id).first();
  if (before !== null && before.last_mutation_id === input.requestId) {
    const repeated = await loadStudentProfile(env, id);
    if (repeated === null) throw new HttpError(500, "profile_result_missing", "保存結果を確認できませんでした。");
    return mapStudentProfile(repeated);
  }
  const currentRevision = before === null ? 0 : before.revision;
  if (currentRevision !== input.expectedRevision) {
    const current = await loadStudentProfile(env, id);
    throw new HttpError(
      409,
      "profile_revision_conflict",
      "別の画面で先に生徒情報が更新されています。最新を再読み込みしてください。",
      { current: current === null ? null : mapStudentProfile(current) }
    );
  }
  const timestamp = nowIso();
  const nextRevision = currentRevision + 1;
  const p = input.profile;
  const mutation = env.DB.prepare(
    `INSERT INTO student_profiles (
      student_id, school_grade, first_choice, other_choices, admission_type,
      current_status, academic_status, current_challenge, teaching_policy,
      next_action, summary, free_memo, revision, last_mutation_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(student_id) DO UPDATE SET
      school_grade = excluded.school_grade,
      first_choice = excluded.first_choice,
      other_choices = excluded.other_choices,
      admission_type = excluded.admission_type,
      current_status = excluded.current_status,
      academic_status = excluded.academic_status,
      current_challenge = excluded.current_challenge,
      teaching_policy = excluded.teaching_policy,
      next_action = excluded.next_action,
      summary = excluded.summary,
      free_memo = excluded.free_memo,
      revision = student_profiles.revision + 1,
      last_mutation_id = excluded.last_mutation_id,
      updated_at = excluded.updated_at
    WHERE student_profiles.revision = ?`
  ).bind(
    id,
    p.schoolGrade,
    p.firstChoice,
    p.otherChoices,
    p.admissionType,
    p.currentStatus,
    p.academicStatus,
    p.currentChallenge,
    p.teachingPolicy,
    p.nextAction,
    p.summary,
    p.freeMemo,
    input.requestId,
    timestamp,
    timestamp,
    currentRevision
  );
  const batch = await env.DB.batch([
    mutation,
    studentProfileAuditStatement(env, actor, input.requestId, id, currentRevision, nextRevision, timestamp),
    studentProfileAppStateStatement(env, timestamp, id, nextRevision, input.requestId)
  ]);
  if ((batch[0]?.meta.changes ?? 0) !== 1) {
    const current = await loadStudentProfile(env, id);
    if (current?.profile_last_mutation_id === input.requestId) {
      return mapStudentProfile(current);
    }
    throw new HttpError(
      409,
      "profile_revision_conflict",
      "保存競合のため更新できませんでした。最新を再読み込みしてください。",
      { current: current === null ? null : mapStudentProfile(current) }
    );
  }
  const updated = await loadStudentProfile(env, id);
  if (updated === null) {
    throw new HttpError(500, "profile_result_missing", "保存結果を確認できませんでした。");
  }
  return mapStudentProfile(updated);
}
function staticStudentInfoResponse(body, contentType, method) {
  return new Response(method === "HEAD" ? null : body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache"
    }
  });
}
var STUDENT_INFO_HTML = ${JSON.stringify(html)};
var STUDENT_INFO_CSS = ${JSON.stringify(css)};
var STUDENT_INFO_JS = ${JSON.stringify(clientJs)};
`;

replaceOnce(
  'var APP_ID = "jp.orio.tg-lesson-memo.cloud";',
  backend + '\nvar APP_ID = "jp.orio.tg-lesson-memo.cloud";',
  "backend insertion"
);

const handleAnchor = 'async function handleApi(request, env, actor, pathname) {\n';
const handleInsert = String.raw`async function handleApi(request, env, actor, pathname) {
  if (request.method === "GET" && pathname === "/api/student-profiles") {
    return jsonResponse({ students: await listStudentProfiles(env) });
  }
  const profileMatch = /^\/api\/student-profiles\/([a-z][a-z0-9_-]{17,79})$/.exec(pathname);
  if (request.method === "PUT" && profileMatch !== null) {
    if (actor.kind !== "browser") {
      throw new HttpError(403, "profile_browser_only", "生徒情報は本人の画面からだけ更新できます。");
    }
    assertSameOriginMutation(request);
    const body = await readJsonBody(request);
    return jsonResponse({
      student: await updateStudentProfile(env, actor, profileMatch[1], parseStudentProfileMutation(body))
    });
  }
`;
replaceOnce(handleAnchor, handleInsert, "handleApi profile routes");

const fetchAnchor = String.raw`        if (isApi) {
          response = await handleApi(request, env, actor, pathname);
        } else if (request.method === "GET" || request.method === "HEAD") {
          const assetRequest = pathname === "/" ? new Request(new URL("/index.html", request.url), request) : request;
`;
const fetchReplacement = String.raw`        if (isApi) {
          response = await handleApi(request, env, actor, pathname);
        } else if ((request.method === "GET" || request.method === "HEAD") && pathname === "/student-info") {
          response = staticStudentInfoResponse(STUDENT_INFO_HTML, "text/html; charset=utf-8", request.method);
        } else if ((request.method === "GET" || request.method === "HEAD") && pathname === "/student-info.css") {
          response = staticStudentInfoResponse(STUDENT_INFO_CSS, "text/css; charset=utf-8", request.method);
        } else if ((request.method === "GET" || request.method === "HEAD") && pathname === "/student-info.js") {
          response = staticStudentInfoResponse(STUDENT_INFO_JS, "application/javascript; charset=utf-8", request.method);
        } else if (request.method === "GET" || request.method === "HEAD") {
          const assetRequest = pathname === "/" ? new Request(new URL("/index.html", request.url), request) : request;
`;
replaceOnce(fetchAnchor, fetchReplacement, "student info page routes");

if (!source.includes('pathname === "/api/student-profiles"')) {
  throw new Error("Profile API route was not inserted");
}
if (!source.includes('pathname === "/student-info"')) {
  throw new Error("Student page route was not inserted");
}
if (!source.includes("CREATE TABLE IF NOT EXISTS student_profiles")) {
  throw new Error("Student profile D1 schema was not inserted");
}

fs.writeFileSync(outputPath, source);
console.log(`Patched Worker written to ${outputPath} (${Buffer.byteLength(source)} bytes)`);
