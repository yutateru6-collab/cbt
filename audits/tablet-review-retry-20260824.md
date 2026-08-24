# Tablet / review-retry implementation QA — 2026-08-24

Final implementation branch before merge: `agent/tablet-review-retry-20260824`

Final QA candidate: `aaa1e3db88a4d4661b0b762a08b9172cfbc8f5d7`

## Implemented

- Formal PC + tablet responsive support for the current 1-pack / 3-pack product scope.
- Individual Reading / Listening review answers are practice-only and do not mutate the original score.
- Listening replay stays on the result screen instead of returning to editable exam mode.
- Writing practice rewrite is separated from the original answer.
- Whole-skill retries for Reading, Listening and Writing; Speaking retry remains premium.
- Full four-skill retry history.
- Initial/full-attempt history and result restoration after reload.
- Break screens between Listening→Reading and Reading→Writing without exposing intermediate scores.
- Premium benefit link retained.
- Service Worker / worker bundle wiring for retry and result-resume assets.
- GitHub Actions device matrix expanded to PC, laptop, iPad portrait/landscape/768 boundary, Android tablet and iPhone.
- 767/768/769 px breakpoint sweep.

## Final browser QA

GitHub Actions run: `32699505818`

- custom status: success
- expected devices: 7
- completed devices: 7
- failed devices: 0
- horizontal overflow: 0
- console errors: 0
- page errors: 0
- request failures: 0

Evidence is retained on the generated `qa-latest` branch. GitHub Actions artifact upload may be skipped when account artifact storage quota is exhausted; this does not change browser QA pass/fail.

## Remaining physical-device caveat

Playwright WebKit/Chromium device profiles do not replace a final physical-device microphone/recording check. Before commercial launch, verify microphone permission, actual recorded audio, headphones/Bluetooth behavior and rotation on at least one physical iPad/tablet and supported Windows PC.
