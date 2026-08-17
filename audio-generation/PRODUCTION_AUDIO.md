# Grade 2 production audio

This file is the human-readable index for the audio that the current Grade 2 app is expected to use.

## Listening

- Baseline release: `20260815-grade2-listening-pauses-v2`
- R2 bucket: `mimilisten-audio`
- Baseline data wiring: `grade2-listening-part2-sets.js`
- Verification manifest: `audio-generation/20260815-grade2-listening-pauses-v2/r2-verification.json`
- Verification count: 180 WAV files (`sample` + `set-01` through `set-05`, 30 each)
- Normalization manifest: `audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json`
- Normalized silence targets: body-to-question `0.8s`, question-number-to-question-text `0.6s`

### Set 01 targeted correction

- Correction release: `20260817-set01-listening-q5-q9-fix-v1`
- Scope: `set-01` Part 1 No.5-No.9 only
- Wiring: `grade2-listening-set01-audio-fixes.js`
- No.5-No.8: remove the reported redundant second Question sequence using the verified PCM frame boundaries from the active masters
- No.9: shorten only an abnormally long opening cue-to-dialogue silence to `0.8s`; do not modify a normal short pause
- Generation: the Worker reads the baseline master from `mimilisten-audio`, creates the correction once under the immutable correction-release key, and mirrors the corrected object to `cbt-project-archive`
- The baseline `20260815-grade2-listening-pauses-v2` objects are not overwritten

For the paid three-run app, the baseline URLs remain the canonical source for all Listening items except the targeted Set 01 No.5-No.9 correction above. The regression test `tests/grade2-listening-r2-source.test.cjs` continues to enforce the baseline source map; the targeted override is covered separately by `tests/grade2-listening-audio-fix.test.cjs`.

## Historical manifest

`audio-generation/cloudflare-r2-production-audio-manifest-20260724-legacy.json` is a preserved historical manifest for the old `20260724-simba32` release. It is **not** the current production listening manifest and must not be referenced by new application code.

`scripts/generate-r2-audio-manifest.mjs` is intentionally retained only as a legacy generator and now writes only the dated `-20260724-legacy.json` file so it cannot overwrite a current-production-looking filename.
