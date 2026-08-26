import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ACTIVE_LOCAL_SPECS = new Set([
  "qa/cbt-light.e2e.spec.cjs",
  "qa/lp-light.e2e.spec.cjs",
  "qa/lp-service-worker.e2e.spec.cjs",
  "qa/review-retry.e2e.spec.cjs",
  "qa/progress-review.e2e.spec.cjs",
  "qa/grade2-speaking-listening-accuracy.e2e.spec.cjs",
]);

const PRODUCTION_SMOKE_FILES = new Set([
  "qa/production-smoke.config.cjs",
  "qa/production-smoke.e2e.spec.cjs",
]);

const FULL_QA_FILES = new Set([
  "qa/device-matrix.cjs",
  "qa/playwright.config.cjs",
  "qa/merge-report.cjs",
  "qa/make-contact-sheet.cjs",
  "scripts/prepare-worker-assets.mjs",
]);

const REPRESENTATIVE_FILES = new Set([
  ".github/workflows/cbt-qa.yml",
  "scripts/classify-ci-changes.mjs",
  "app-config-grade2.js",
  "app.js",
  "exam-data.js",
  "cloudflare-worker.js",
  "purchaser-benefits-access.js",
  "purchaser-benefits-worker.js",
  "wrangler.jsonc",
]);

const AUDIO_PIPELINE_FILES = new Set([
  "listening-audio-fix.js",
  "grade2-listening-three-set-audio-fix.js",
  "grade2-listening-set01-duplicate-v2-fix.js",
  "grade2-listening-set01-no05-duplicate-fix.js",
  "grade2-listening-set01-audio-fixes.js",
  "scripts/build-grade2-three-set-corrected-audio.mjs",
  "scripts/build-set01-duplicate-question-v2-audio.mjs",
  "scripts/verify-cloudflare-listening-audio.mjs",
  "scripts/inspect-grade2-three-set-pauses.mjs",
  "scripts/inspect-set01-intro-gaps.mjs",
]);

const AUDIO_EXTENSIONS = /\.(?:wav|mp3|m4a|aac|ogg|flac)$/i;

export function normalizeChangedPath(value) {
  return String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\.\//, "");
}

function isFullQaPath(file) {
  if (FULL_QA_FILES.has(file)) return true;
  if (/^(?:index|exam|bonus|privacy|support|terms|tokusho)\.html$/.test(file)) return true;
  if (/^(?:styles|lp|legal|bonus|grade2-[^/]+)\.css$/.test(file)) return true;
  if (["manifest.webmanifest", "sw.js", "sw-set02-v2.js"].includes(file)) return true;
  if (file.startsWith("assets/") && !file.startsWith("assets/audio/")) return true;
  if (file === "output/pdf/eiken-grade2-final-check-writing-template.pdf") return true;
  if (file === "package.json" || file === "package-lock.json") return true;
  return false;
}

function isRepresentativeQaPath(file) {
  if (REPRESENTATIVE_FILES.has(file) || AUDIO_PIPELINE_FILES.has(file)) return true;
  if (/^grade2-[^/]+\.js$/.test(file)) return true;
  if (/^(?:pre1|pre2)-[^/]+\.js$/.test(file)) return true;
  if (file.startsWith("tools/listening-player/")) return true;
  if (file.startsWith("audio-generation/") || file.startsWith("assets/audio/") || file.startsWith("audio/")) return true;
  return AUDIO_EXTENSIONS.test(file);
}

function isDocumentationPath(file) {
  return file.startsWith("docs/") ||
    file.startsWith("audits/") ||
    file.startsWith("exports/") ||
    /\.(?:md|txt|docx)$/i.test(file);
}

export function classifyCiChanges(files, { forceScope = "" } = {}) {
  const normalized = [...new Set((files || []).map(normalizeChangedPath).filter(Boolean))];
  if (forceScope) {
    if (!["representative", "full"].includes(forceScope)) {
      throw new Error(`Unsupported forced QA scope: ${forceScope}`);
    }
    return {
      localScope: forceScope,
      localSpecs: [],
      runProductionSmoke: false,
      runReport: true,
      reason: `forced-${forceScope}`,
      files: normalized,
    };
  }

  const productionSmokeChanged = normalized.some((file) => PRODUCTION_SMOKE_FILES.has(file));
  const targetedSpecs = normalized.filter((file) => ACTIVE_LOCAL_SPECS.has(file));
  const fullMatches = normalized.filter(isFullQaPath);
  const representativeMatches = normalized.filter(isRepresentativeQaPath);
  // A smoke-test-only edit can safely check the currently deployed production.
  // When runtime/build files also changed, current production is intentionally
  // stale; the post-deploy production smoke workflow performs the valid check.
  const runProductionSmoke =
    productionSmokeChanged && fullMatches.length === 0 && representativeMatches.length === 0;

  if (fullMatches.length) {
    return {
      localScope: "full",
      localSpecs: [],
      runProductionSmoke,
      runReport: true,
      reason: `full:${fullMatches.join(",")}`,
      files: normalized,
    };
  }
  if (representativeMatches.length) {
    return {
      localScope: "representative",
      localSpecs: [],
      runProductionSmoke,
      runReport: true,
      reason: `representative:${representativeMatches.join(",")}`,
      files: normalized,
    };
  }
  if (targetedSpecs.length) {
    return {
      localScope: "targeted",
      localSpecs: targetedSpecs,
      runProductionSmoke,
      runReport: targetedSpecs.includes("qa/cbt-light.e2e.spec.cjs"),
      reason: `targeted:${targetedSpecs.join(",")}`,
      files: normalized,
    };
  }

  const knownNoBrowserFiles = normalized.filter((file) =>
    file.startsWith("qa/") ||
    file.startsWith("tests/") ||
    file.startsWith("scripts/") ||
    file.startsWith(".github/workflows/") ||
    isDocumentationPath(file),
  );
  const unknown = normalized.filter((file) => !knownNoBrowserFiles.includes(file));
  if (unknown.length) {
    return {
      localScope: "full",
      localSpecs: [],
      runProductionSmoke,
      runReport: true,
      reason: `fail-safe-unknown:${unknown.join(",")}`,
      files: normalized,
    };
  }

  return {
    localScope: "none",
    localSpecs: [],
    runProductionSmoke,
    runReport: false,
    reason: runProductionSmoke ? "production-smoke-test-only" : "static-checks-only",
    files: normalized,
  };
}

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

function writeGithubOutputs(result) {
  if (!process.env.GITHUB_OUTPUT) return;
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `local_scope=${result.localScope}`,
      `local_specs=${result.localSpecs.join(",")}`,
      `run_production_smoke=${result.runProductionSmoke ? "true" : "false"}`,
      `run_report=${result.runReport ? "true" : "false"}`,
      `reason=${result.reason}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

function main() {
  const forceScope = parseArg("force");
  const filesPath = parseArg("files");
  let files = [];
  if (filesPath) {
    files = fs.readFileSync(filesPath, "utf8").split(/\r?\n/);
  } else if (!forceScope) {
    throw new Error("Usage: node scripts/classify-ci-changes.mjs --files=<changed-files.txt> | --force=<representative|full>");
  }

  const result = classifyCiChanges(files, { forceScope });
  console.log(`Local browser QA scope: ${result.localScope}`);
  console.log(`Production smoke test requested: ${result.runProductionSmoke}`);
  console.log(`Reason: ${result.reason}`);
  writeGithubOutputs(result);
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  main();
}
