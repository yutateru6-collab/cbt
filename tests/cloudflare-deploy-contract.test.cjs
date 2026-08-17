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
  assert.deepEqual(
    wrangler.r2_buckets,
    [
      { binding: "MIMILISTEN_AUDIO", bucket_name: "mimilisten-audio" },
      { binding: "CBT_PROJECT_ARCHIVE", bucket_name: "cbt-project-archive" },
    ],
  );
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

test("audio verifier supports fail-closed real-master preflight", () => {
  assert.match(verifier, /--expected-only/);
  assert.match(verifier, /GRADE2_LISTENING_INTRO_GAP_RELEASE/);
  assert.match(verifier, /fixGrade2Set01IntroAndQuestionGapWav/);
  assert.match(verifier, /targetIntroGapFrames !== 19200/);
  assert.match(verifier, /GRADE2_LISTENING_FIX_RELEASE/);
});

test("staging workflow deploys agent branches only to cbt-staging and seeds isolated R2", () => {
  assert.match(staging, /branches:\s*\n\s*-\s*"agent\/\*\*"/);
  assert.match(staging, /wrangler deploy --env staging/);
  assert.match(staging, /cbt-staging\.itisnowornever271\.workers\.dev/);
  assert.match(staging, /mimilisten-audio-staging/);
  assert.match(staging, /cbt-project-archive-staging/);
  assert.match(staging, /verify-cloudflare-listening-audio\.mjs --expected-only/);
  assert.ok(
    staging.indexOf("verify-cloudflare-listening-audio.mjs --expected-only") <
      staging.indexOf("wrangler deploy --env staging --config wrangler.jsonc"),
    "real-master preflight must run before staging deployment",
  );
});

test("production workflow deploys main only to the production Worker", () => {
  assert.match(production, /branches:\s*\n\s*-\s*main/);
  assert.match(production, /npx wrangler deploy --config wrangler\.jsonc/);
  assert.doesNotMatch(production, /wrangler deploy --env staging/);
  assert.match(production, /https:\/\/cbt\.itisnowornever271\.workers\.dev/);
  assert.match(production, /verify-cloudflare-listening-audio\.mjs --expected-only/);
  assert.ok(
    production.indexOf("verify-cloudflare-listening-audio.mjs --expected-only") <
      production.indexOf("npx wrangler deploy --config wrangler.jsonc"),
    "real-master preflight must run before production deployment",
  );
});
