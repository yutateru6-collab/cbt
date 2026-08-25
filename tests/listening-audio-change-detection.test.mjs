import assert from "node:assert/strict";
import test from "node:test";
import {
  detectListeningAudioChanges,
  isListeningAudioAffectingPath,
} from "../scripts/detect-listening-audio-change.mjs";

test("ordinary app and QA changes do not request an R2 audio sync", () => {
  const result = detectListeningAudioChanges([
    "exam.html",
    "styles.css",
    "grade2-progress-review.js",
    ".github/workflows/cbt-production.yml",
    "tests/cloudflare-deploy-contract.test.cjs",
  ]);
  assert.equal(result.required, false);
  assert.equal(result.reason, "no-audio-input-changes");
  assert.deepEqual(result.matched, []);
});

test("direct listening audio pipeline inputs request a full R2 audio sync", () => {
  for (const file of [
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
  ]) {
    assert.equal(isListeningAudioAffectingPath(file), true, file);
  }
});

test("audio-generation inputs and audio files request a full R2 audio sync", () => {
  for (const file of [
    "audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json",
    "audio-generation/future-release/notes.json",
    "assets/audio/listening/No01.wav",
    "audio/source/master.mp3",
    "somewhere/new-listening-source.flac",
  ]) {
    assert.equal(isListeningAudioAffectingPath(file), true, file);
  }
});

test("mixed changes report only the audio-affecting paths", () => {
  const result = detectListeningAudioChanges([
    "./exam.html",
    "audio-generation/release/normalization-manifest.json",
    "grade2-listening-three-set-audio-fix.js",
    "styles.css",
  ]);
  assert.equal(result.required, true);
  assert.equal(result.reason, "matched-audio-inputs");
  assert.deepEqual(result.matched, [
    "audio-generation/release/normalization-manifest.json",
    "grade2-listening-three-set-audio-fix.js",
  ]);
});

test("manual or missing-base safety override always requests a full sync", () => {
  for (const reason of ["workflow-dispatch", "missing-push-base"]) {
    const result = detectListeningAudioChanges(["exam.html"], { forceReason: reason });
    assert.equal(result.required, true);
    assert.equal(result.reason, reason);
    assert.deepEqual(result.matched, []);
  }
});
