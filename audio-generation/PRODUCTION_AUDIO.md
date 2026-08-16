# Grade 2 production audio

This file is the human-readable index for the audio that the current Grade 2 app is expected to use.

## Listening

- Active release: `20260815-grade2-listening-pauses-v2`
- R2 bucket: `mimilisten-audio`
- Active data wiring: `grade2-listening-part2-sets.js`
- Verification manifest: `audio-generation/20260815-grade2-listening-pauses-v2/r2-verification.json`
- Verification count: 180 WAV files (`sample` + `set-01` through `set-05`, 30 each)
- Normalization manifest: `audio-generation/20260815-grade2-listening-pauses-v2/normalization-manifest.json`
- Normalized silence targets: body-to-question `0.8s`, question-number-to-question-text `0.6s`

For the paid three-run app, `set-01`, `set-02`, and `set-03` must resolve exclusively to the active R2 release above. The regression test `tests/grade2-listening-r2-source.test.cjs` enforces all 90 URLs.

## Historical manifest

`audio-generation/cloudflare-r2-production-audio-manifest-20260724-legacy.json` is a preserved historical manifest for the old `20260724-simba32` release. It is **not** the current production listening manifest and must not be referenced by new application code.

`scripts/generate-r2-audio-manifest.mjs` is intentionally retained only as a legacy generator and now writes only the dated `-20260724-legacy.json` file so it cannot overwrite a current-production-looking filename.
