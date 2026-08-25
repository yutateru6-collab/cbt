const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const wrangler = JSON.parse(fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8"));
const prepare = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");
const verifier = fs.readFileSync(path.join(root, "scripts", "verify-cloudflare-listening-audio.mjs"), "utf8");
const browserQa = fs.readFileSync(path.join(root, ".github", "workflows", "cbt-qa.yml"), "utf8");
const staging = fs.readFileSync(path.join(root, ".github", "workflows", "cbt-staging.yml"), "utf8");
const production = fs.readFileSync(path.join(root, ".github", "workflows", "cbt-production.yml"), "utf8");
const productionSmoke = fs.readFileSync(path.join(root, ".github", "workflows", "cbt-production-smoke.yml"), "utf8");
const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const purchaserWorker = fs.readFileSync(path.join(root, "purchaser-benefits-worker.js"), "utf8");
const resultTabs = fs.readFileSync(path.join(root, "grade2-result-tabs.js"), "utf8");
const resultTabsCss = fs.readFileSync(path.join(root, "grade2-result-tabs.css"), "utf8");
const reviewRetry = fs.readFileSync(path.join(root, "grade2-review-retry.js"), "utf8");
const reviewRetryCss = fs.readFileSync(path.join(root, "grade2-review-retry.css"), "utf8");
const reviewResume = fs.readFileSync(path.join(root, "grade2-review-resume.js"), "utf8");

test("production R2 bindings stay unchanged", () => {
  assert.deepEqual(wrangler.r2_buckets, [
    { binding: "MIMILISTEN_AUDIO", bucket_name: "mimilisten-audio" },
    { binding: "CBT_PROJECT_ARCHIVE", bucket_name: "cbt-project-archive" },
  ]);
});

test("dynamic listening, public exam gate, and purchaser-benefit routes run through the Worker before SPA fallback", () => {
  assert.equal(wrangler.main, "./purchaser-benefits-worker.js");
  assert.deepEqual(wrangler.assets?.run_worker_first, [
    "/audio-r2/*",
    "/exam.html",
    "/bonus.html",
    "/output/pdf/eiken-grade2-final-check-writing-template.pdf",
  ]);
  assert.equal(wrangler.assets?.not_found_handling, "single-page-application");
});

test("public exam gate allows only the sample plan outside staging", () => {
  assert.match(purchaserWorker, /const EXAM_PATH = "\/exam\.html"/);
  assert.match(purchaserWorker, /const PUBLIC_SAMPLE_PLAN = "sample"/);
  assert.match(purchaserWorker, /CBT_ENVIRONMENT/);
  assert.match(purchaserWorker, /isStagingEnvironment\(env\)/);
  assert.match(purchaserWorker, /plan === PUBLIC_SAMPLE_PLAN/);
  assert.match(purchaserWorker, /status:\s*303/);
  assert.match(purchaserWorker, /destination\.hash = "pricing"/);
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

test("documentation is not shipped as a Worker runtime asset", () => {
  assert.doesNotMatch(prepare, /"README\.md"/);
});

test("browser QA is path-filtered on agent branches and reusable by production", () => {
  assert.match(browserQa, /branches:\s*\n\s*-\s*"agent\/\*\*"/);
  assert.doesNotMatch(browserQa, /branches:\s*[\s\S]*?-\s*main[\s\S]*?paths:/);
  assert.match(browserQa, /workflow_call:/);
  assert.match(browserQa, /scripts\/classify-ci-changes\.mjs/);
  assert.match(browserQa, /--project=desktop-1440x900/);
  assert.match(browserQa, /--project=ipad-820x1180/);
  assert.match(browserQa, /--project=iphone-16-393x852/);
  const targetedBlock = browserQa.match(/targeted\)[\s\S]*?;;/)?.[0] || "";
  assert.match(targetedBlock, /--project=desktop-1440x900/);
  assert.match(targetedBlock, /--project=ipad-820x1180/);
  assert.match(targetedBlock, /--project=iphone-16-393x852/);
  assert.match(targetedBlock, /"\$\{specs\[@\]\}"/);
  assert.match(browserQa, /git rev-parse "\$GITHUB_SHA\^"/);
  assert.match(browserQa, /LOCAL_SCOPE" = 'representative' \] \|\| \[ "\$LOCAL_SCOPE" = 'targeted'/);
});

test("deployment workflows use positive path allowlists", () => {
  const stagingPush = staging.match(/push:[\s\S]*?workflow_dispatch:/)?.[0] || "";
  const productionPush = production.match(/push:[\s\S]*?workflow_dispatch:/)?.[0] || "";
  assert.match(stagingPush, /paths:[\s\S]*?purchaser-benefits-worker\.js/);
  assert.match(stagingPush, /audio-generation\/\*\*/);
  assert.doesNotMatch(stagingPush, /exam\.html/);
  assert.match(productionPush, /paths:[\s\S]*?exam\.html/);
  assert.doesNotMatch(productionPush, /qa\/\*\*/);
});

test("production deploy waits for reusable browser QA and smoke stays success-gated", () => {
  assert.match(production, /browser-qa:\s*\n\s*uses:\s*\.\/\.github\/workflows\/cbt-qa\.yml/);
  assert.match(production, /deploy:\s*\n\s*needs:\s*browser-qa/);
  assert.match(productionSmoke, /workflow_run:[\s\S]*?workflows:\s*\n\s*-\s*"?Deploy CBT production"?/);
  assert.match(productionSmoke, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(productionSmoke, /github\.event\.workflow_run\.head_branch == 'main'/);
});

test("public Worker bundle strips paid LP entry links and developer entry", () => {
  assert.match(prepare, /single paid CTA/);
  assert.match(prepare, /three-pack paid CTA/);
  assert.match(prepare, /public developer entry/);
  assert.match(prepare, /Public landing page still exposes a paid exam URL/);
  assert.match(prepare, /Public landing page still exposes a developer entry link/);
  assert.match(prepare, /販売準備中/);
});

test("Worker bundle contains the complete canonical explanation pipeline", () => {
  for (const file of ["grade2-legacy-explanation-cleanup.js", "grade2-set-01-explanations.js", "grade2-skill-explanations.js", "grade2-explanation-sync.js", "grade2-canonical-explanations.js"]) {
    assert.ok(prepare.includes(`\"${file}\"`), `${file} must be copied into worker-dist`);
  }
});

test("LP and exam share one current service worker", () => {
  assert.match(examHtml, /serviceWorker\.register\("\.\/sw\.js\?v=grade2-public-entry-safety-v1"/);
  assert.doesNotMatch(examHtml, /serviceWorker\.register\("\.\/sw-set02-v2\.js/);
  assert.match(serviceWorker, /cbt-grade2-app-shell-v87-public-entry-safety/);
  assert.match(serviceWorker, /url\.pathname !== "\/exam\.html"/);
  assert.match(serviceWorker, /url\.searchParams\.get\("plan"\)/);
});

test("Worker bundle and app shell contain the tabbed result experience", () => {
  assert.doesNotThrow(() => new vm.Script(resultTabs));
  for (const file of ["grade2-result-tabs.js", "grade2-result-tabs.css"]) {
    assert.ok(prepare.includes(`\"${file}\"`), `${file} must be copied into worker-dist`);
    assert.ok(serviceWorker.includes(`\"/${file}\"`), `${file} must be cached in the app shell`);
  }
  assert.match(examHtml, /grade2-result-tabs\.css\?v=grade2-result-tabs-v1/);
  assert.match(examHtml, /grade2-result-tabs\.js\?v=grade2-result-tabs-v1/);
  assert.ok(examHtml.indexOf("grade2-ai-grading-flow.js?") < examHtml.indexOf("grade2-result-tabs.js?"));
  assert.match(resultTabs, /data-grade2-result-tab/);
  assert.match(resultTabs, /要復習/);
  assert.match(resultTabsCss, /position:\s*sticky/);
  assert.match(resultTabsCss, /@media \(max-width: 390px\)/);
});

test("Worker bundle and app shell contain tablet review, retry, and result-resume assets", () => {
  assert.doesNotThrow(() => new vm.Script(reviewRetry));
  assert.doesNotThrow(() => new vm.Script(reviewResume));
  for (const file of ["grade2-review-retry.js", "grade2-review-retry.css", "grade2-review-resume.js"]) {
    assert.ok(prepare.includes(`\"${file}\"`), `${file} must be copied into worker-dist`);
    assert.ok(serviceWorker.includes(`\"/${file}\"`), `${file} must be cached in the app shell`);
    assert.ok(examHtml.includes(file), `${file} must be referenced by exam.html`);
  }
  assert.match(reviewRetry, /初回スコアに反映されません/);
  assert.match(reviewRetry, /4技能を最初からもう一度受験/);
  assert.match(reviewResume, /attempt-history-v1/);
  assert.match(reviewRetryCss, /@media \(min-width: 768px\) and \(max-width: 1180px\)/);
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

test("production verification compares deployed bundle assets and enforces the public exam gate", () => {
  for (const file of [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "grade2-result-tabs.js",
    "grade2-result-tabs.css",
    "grade2-normal-user-fixes.css",
    "grade2-review-retry.js",
    "grade2-review-retry.css",
    "grade2-review-resume.js",
    "support.html",
  ]) {
    assert.ok(production.includes(file), `${file} must be verified after production deploy`);
  }
  assert.match(production, /local_path="worker-dist\/\$file"/);
  assert.match(production, /exam\.html" \]; then[\s\S]*plan=sample/);
  assert.match(production, /for plan in single three/);
  assert.match(production, /test "\$status" = '303'/);
  assert.match(production, /prod-index\.html/);
  assert.match(production, /Unexpected production start_url/);
  assert.doesNotMatch(production, /\bsw-set02-v2\.js \\\n/);
  assert.match(production, /node --check grade2-review-retry\.js/);
  assert.match(production, /node --check grade2-review-resume\.js/);
});
