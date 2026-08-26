import assert from "node:assert/strict";
import test from "node:test";
import { classifyCiChanges } from "../scripts/classify-ci-changes.mjs";

function classify(files) {
  return classifyCiChanges(files);
}

test("QA-only changes run only the changed active browser spec", () => {
  const result = classify(["qa/lp-light.e2e.spec.cjs"]);
  assert.equal(result.localScope, "targeted");
  assert.deepEqual(result.localSpecs, ["qa/lp-light.e2e.spec.cjs"]);
  assert.equal(result.runProductionSmoke, false);
  assert.equal(result.runReport, false);
});

test("production smoke edits check current production without local or deploy work", () => {
  const result = classify(["qa/production-smoke.e2e.spec.cjs"]);
  assert.equal(result.localScope, "none");
  assert.equal(result.runProductionSmoke, true);
});

test("ordinary runtime, Worker, and Listening changes use representative PC, tablet, and mobile QA", () => {
  for (const file of [
    "app.js",
    "purchaser-benefits-worker.js",
    "grade2-listening-part2-sets.js",
    "audio-generation/new-release/manifest.json",
  ]) {
    assert.equal(classify([file]).localScope, "representative", file);
  }
});

test("layout, responsive, Service Worker, build, and QA-matrix changes keep full seven-device QA", () => {
  for (const file of [
    "exam.html",
    "styles.css",
    "grade2-result-tabs.css",
    "assets/lp-result.png",
    "sw.js",
    "qa/device-matrix.cjs",
    "scripts/prepare-worker-assets.mjs",
  ]) {
    assert.equal(classify([file]).localScope, "full", file);
  }
});

test("QA workflow and classifier edits use the representative three-device safety net", () => {
  for (const file of [
    ".github/workflows/cbt-qa.yml",
    "scripts/classify-ci-changes.mjs",
  ]) {
    assert.equal(classify([file]).localScope, "representative", file);
  }
});

test("static tests and deployment workflow edits do not start browsers by themselves", () => {
  for (const file of [
    "tests/cloudflare-deploy-contract.test.cjs",
    ".github/workflows/cbt-production.yml",
    "scripts/remove-grade2-legacy-listening-explanations.mjs",
  ]) {
    assert.equal(classify([file]).localScope, "none", file);
  }
});

test("documentation mixed with a production smoke edit stays smoke-only", () => {
  const result = classify(["docs/QA_SCREENSHOT_FLOW.md", "qa/production-smoke.e2e.spec.cjs"]);
  assert.equal(result.localScope, "none");
  assert.equal(result.runProductionSmoke, true);
});

test("production smoke edits wait for the post-deploy check when runtime files also changed", () => {
  const representative = classify(["app.js", "qa/production-smoke.e2e.spec.cjs"]);
  assert.equal(representative.localScope, "representative");
  assert.equal(representative.runProductionSmoke, false);

  const full = classify(["exam.html", "qa/production-smoke.e2e.spec.cjs"]);
  assert.equal(full.localScope, "full");
  assert.equal(full.runProductionSmoke, false);
});

test("mixed changes choose the safest required local scope", () => {
  assert.equal(classify(["qa/lp-light.e2e.spec.cjs", "app.js"]).localScope, "representative");
  assert.equal(classify(["app.js", "lp.css"]).localScope, "full");
});

test("an unknown path that reaches the QA workflow fails safe to full QA", () => {
  assert.equal(classify(["future-runtime.entry"]).localScope, "full");
});

test("manual scope can explicitly select representative or full QA", () => {
  assert.equal(classifyCiChanges([], { forceScope: "representative" }).localScope, "representative");
  assert.equal(classifyCiChanges([], { forceScope: "full" }).localScope, "full");
  assert.throws(() => classifyCiChanges([], { forceScope: "targeted" }), /Unsupported forced QA scope/);
});
