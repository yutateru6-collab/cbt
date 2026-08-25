const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const production = fs.readFileSync(path.join(root, '.github', 'workflows', 'cbt-production.yml'), 'utf8');
const staging = fs.readFileSync(path.join(root, '.github', 'workflows', 'cbt-staging.yml'), 'utf8');
const detector = fs.readFileSync(path.join(root, 'scripts', 'detect-listening-audio-change.mjs'), 'utf8');

function stepBlock(source, name) {
  const marker = `      - name: ${name}\n`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step: ${name}`);
  const next = source.indexOf('\n      - name:', start + marker.length);
  return source.slice(start, next === -1 ? source.length : next);
}

function assertAudioConditional(source, name) {
  assert.match(
    stepBlock(source, name),
    /if: steps\.audio_sync\.outputs\.required == 'true'/,
    `${name} must run only when Listening audio sync is required`,
  );
}

test('production detects audio inputs and gates only expensive audio write work', () => {
  assert.match(production, /fetch-depth:\s*2/);
  const detect = stepBlock(production, 'Detect whether Listening audio sync is required');
  assert.match(detect, /--force=workflow-dispatch/);
  assert.match(detect, /--force=missing-push-base/);
  assert.match(detect, /git diff --name-only/);
  assert.match(detect, /detect-listening-audio-change\.mjs/);

  for (const name of [
    'Preflight real listening corrections',
    'Build precomputed 90-file corrected release',
    'Build exactly six Set 01 duplicate-question v2 WAVs',
    'Upload precomputed 90-file corrected release to production R2',
    'Upload exactly six Set 01 duplicate-question v2 WAVs to production R2',
  ]) {
    assertAudioConditional(production, name);
  }

  assert.doesNotMatch(stepBlock(production, 'Validate production bundle'), /if: steps\.audio_sync/);
  assert.doesNotMatch(stepBlock(production, 'Deploy Worker cbt'), /if: steps\.audio_sync/);
  const verify = stepBlock(production, 'Verify production deployment');
  assert.doesNotMatch(verify, /if: steps\.audio_sync/);
  assert.match(verify, /verify-cloudflare-listening-audio\.mjs "\$base"/);
});

test('staging forces a sync for new buckets but otherwise gates expensive audio work', () => {
  assert.match(staging, /fetch-depth:\s*2/);
  const detect = stepBlock(staging, 'Detect whether Listening audio inputs changed');
  assert.match(detect, /--force=workflow-dispatch/);
  assert.match(detect, /--force=missing-push-base/);
  assert.match(detect, /git diff --name-only/);

  const buckets = stepBlock(staging, 'Ensure isolated staging R2 buckets');
  assert.doesNotMatch(buckets, /if: steps\.audio_sync/);
  assert.match(buckets, /created='true'/);

  const resolve = stepBlock(staging, 'Resolve staging Listening audio sync requirement');
  assert.match(resolve, /STAGING_BUCKET_CREATED/);
  assert.match(resolve, /staging-bucket-created/);

  for (const name of [
    'Audit actual Set 01-03 listening pauses',
    'Preflight real listening corrections',
    'Build precomputed 90-file corrected release',
    'Build exactly six Set 01 duplicate-question v2 WAVs',
    'Seed legacy Set 01 sources into staging R2',
    'Upload precomputed 90-file corrected release to staging R2',
    'Upload exactly six Set 01 duplicate-question v2 WAVs to staging R2',
  ]) {
    assertAudioConditional(staging, name);
  }

  assert.doesNotMatch(stepBlock(staging, 'Validate staging bundle'), /if: steps\.audio_sync/);
  assert.doesNotMatch(stepBlock(staging, 'Deploy cbt-staging'), /if: steps\.audio_sync/);
  const verify = stepBlock(staging, 'Verify staging deployment');
  assert.doesNotMatch(verify, /if: steps\.audio_sync/);
  assert.match(verify, /verify-cloudflare-listening-audio\.mjs "\$base"/);
});

test('detector keeps normal app changes light and recognizes direct audio inputs', () => {
  assert.match(detector, /audio-generation\//);
  assert.match(detector, /AUDIO_EXTENSIONS/);
  assert.match(detector, /listening-audio-fix\.js/);
  assert.match(detector, /grade2-listening-three-set-audio-fix\.js/);
  assert.match(detector, /grade2-listening-set01-duplicate-v2-fix\.js/);
  assert.match(detector, /scripts\/build-grade2-three-set-corrected-audio\.mjs/);
  assert.match(detector, /scripts\/build-set01-duplicate-question-v2-audio\.mjs/);
});
