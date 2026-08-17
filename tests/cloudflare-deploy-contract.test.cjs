const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const wrangler = JSON.parse(fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));
const prepare = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");
const verifier = fs.readFileSync(path.join(root, "scripts", "verify-cloudflare-listening-audio.mjs"), "utf8");
const staging = fs.readFileSync(path.join(root, ".github", "workflows", "cbt-staging.yml"), "utf8");
const production = fs.readFileSync(path.join(root, ".github", "workflows", "cbt-production.yml"), "utf8");

test("production R2 bindings stay unchanged", () => {
  assert.deepEqual(wrangler.r2_buckets, [
    { binding: "MIMILISTEN_AUDIO", bucket_name: "mimilisten-audio" },
    { binding: "CBT_PROJECT_ARCHIVE", bucket_name: "cbt-project-archive" },
  ]);
});

test("dynamic listening audio routes through the Worker before SPA fallback", () => {
  assert.deepEqual(wrangler.assets?.run_worker_first, ["/audio-r2/*"]);
  assert.equal(wrangler.assets?.not_found_handling, "single-page-application");
});

test("staging Worker uses only staging R2 buckets", () => {
  const config = wrangler.env?.staging;
  assert.ok(config);
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, true);
  assert.equal(config.vars?.CBT_ENVIRONMENT, "staging");
  const byBinding = Object.fromEntries(config.r2_buckets.map((entry) => [entry.binding, entry.bucket_name]));
  assert.equal(byBinding.MIMILISTEN_AUDIO, "mimilisten-audio-staging");
  assert.equal(byBinding.CBT_PROJECT_ARCHIVE, "cbt-project-archive-staging");
  assert.ok(config.r2_buckets.every((entry) => entry.bucket_name.endsWith("-staging")));
});

test("Worker build emits verifiable build metadata", () => {
  assert.match(prepare, /build-info\.json/);
  assert.match(prepare, /CBT_BUILD_SHA/);
  assert.match(prepare, /CBT_BUILD_REF/);
  assert.match(prepare, /CBT_DEPLOY_ENV/);
});

test("Worker bundle contains the complete canonical explanation pipeline", () => {
  for (const file of ["grade2-legacy-explanation-cleanup.js", "grade2-set-01-explanations.js", "grade2-skill-explanations.js", "grade2-explanation-sync.js", "grade2-canonical-explanations.js"]) {
    assert.ok(prepare.includes(`\"${file}\"`), `${file} must be copied into worker-dist`);
  }
});

test("audio verifier fail-closes on 90 immutable sources and exactly six v2 overlays", () => {
  assert.match(verifier, /--expected-only/);
  assert.match(verifier, /GRADE2_LISTENING_THREE_SET_PAUSES_RELEASE/);
  assert.match(verifier, /GRADE2_LISTENING_SET01_DUPLICATE_QUESTION_FIX_V2_RELEASE/);
  assert.match(verifier, /fixGrade2ThreeSetOneSecondPausesWav/);
  assert.match(verifier, /fixGrade2Set01DuplicateQuestionV2FromOneSecondWav/);
  assert.match(verifier, /duplicateQuestionFixIds = new Set\(\[6, 7, 8, 10, 12, 14\]\)/);
  assert.match(verifier, /sourceSha !== item\.outputSha256/);
  assert.match(verifier, /targetIntroGapFrames !== 24000/);
  assert.match(verifier, /targetBodyQuestionGapFrames !== 24000/);
  assert.match(verifier, /targetQuestionGapFrames !== 19200/);
  assert.match(verifier, /overlayVerified !== 6/);
  assert.match(verifier, /byte-identical prefix/);
});

test("staging precomputes 90 normal WAVs plus exactly six v2 overlays before deploy", () => {
  assert.match(staging, /branches:\s*\n\s*-\s*"agent\/\*\*"/);
  assert.match(staging, /inspect-grade2-three-set-pauses\.mjs/);
  assert.match(staging, /build-grade2-three-set-corrected-audio\.mjs/);
  assert.match(staging, /build-set01-duplicate-question-v2-audio\.mjs/);
  assert.match(staging, /for n in 06 07 08 10 12 14/);
  assert.match(staging, /20260817-set01-listening-duplicate-question-fix-v2/);
  assert.match(staging, /mimilisten-audio-staging/);
  assert.match(staging, /cbt-project-archive-staging/);
  assert.match(staging, /verify-cloudflare-listening-audio\.mjs --expected-only/);
  assert.match(staging, /wrangler deploy --env staging/);
  assert.doesNotMatch(staging, /openai-whisper|TRANSCRIPT_DIAGNOSTIC_STOP/);
  assert.ok(staging.indexOf("Build exactly six Set 01 duplicate-question v2 WAVs") < staging.indexOf("wrangler deploy --env staging --config wrangler.jsonc"));
  assert.ok(staging.indexOf("Upload exactly six Set 01 duplicate-question v2 WAVs to staging R2") < staging.indexOf("wrangler deploy --env staging --config wrangler.jsonc"));
});

test("production remains main-only and precomputes exactly six v2 overlays before deploy", () => {
  assert.match(production, /branches:\s*\n\s*-\s*main/);
  assert.match(production, /build-grade2-three-set-corrected-audio\.mjs/);
  assert.match(production, /build-set01-duplicate-question-v2-audio\.mjs/);
  assert.match(production, /for n in 06 07 08 10 12 14/);
  assert.match(production, /20260817-set01-listening-duplicate-question-fix-v2/);
  assert.match(production, /verify-cloudflare-listening-audio\.mjs --expected-only/);
  assert.match(production, /npx wrangler deploy --config wrangler\.jsonc/);
  assert.doesNotMatch(production, /wrangler deploy --env staging/);
  assert.ok(production.indexOf("Upload exactly six Set 01 duplicate-question v2 WAVs to production R2") < production.indexOf("Deploy Worker cbt"));
});
