# CBT Normal-User QA

This QA is separate from the developer-navigation QA in `qa/cbt.e2e.spec.cjs`.

## Purpose

Verify the Grade 2 paid CBT exactly through the normal user surface. The test never adds `dev=1`, never uses the developer toolbar, and never uses developer skip controls.

Normal user URL:

`https://cbt.itisnowornever271.workers.dev/exam.html?plan=three`

## Coverage

The dedicated Playwright flow runs Set 01, Set 02, and Set 03 on both:

- desktop Chromium: 1440 × 900, deviceScaleFactor 1
- iPhone 16 equivalent WebKit: 393 × 852, deviceScaleFactor 3, touch enabled

For each set it checks:

1. normal paid start screen and selected set
2. Speaking preflight, sound check, microphone check, test recording and playback
3. Speaking flow using the real normal controls; a QA microphone/MediaRecorder test double supplies local test audio and only timers are accelerated
4. Listening No.1–30 in normal auto-advance order
5. Reading No.1–31, including a back/forward answer-persistence check
6. both Writing tasks with real text input and the normal finish-confirmation modal
7. result screen and Listening review open/close
8. Set 01 restart back to a clean start screen

The production-triggered run also probes representative real Speaking and Listening audio URLs over HTTP.

## Evidence

Normal-user QA writes only its latest evidence to the dedicated `qa-normal-latest` branch. It does not overwrite `qa-latest`.

Evidence includes:

- `report.json` and `latest.json`
- per-device/per-set report parts
- device-scale viewport PNG files
- CSS-scale JPEG previews
- full-page start/result screenshots
- desktop and iPhone contact sheets
- build/deployment metadata

The report records page errors, console errors, request failures, horizontal overflow, overflowing elements, clipped-text candidates, sub-44×44 touch targets, and any normal-screen developer-entry exposure.

## Triggers

`.github/workflows/cbt-normal-user-qa.yml` runs:

- on pushes to `agent/qa-normal-user-**` against an exact local build of that branch
- after the `Deploy CBT production` workflow completes successfully, against the exact live production commit
- manually through `workflow_dispatch`

A production run first waits until `/build-info.json` reports the expected deployed commit before testing.

## Safety

- main is never force-pushed.
- only `qa-normal-latest` may be force-replaced with latest QA evidence.
- microphone and recording data are synthetic QA-only browser inputs.
- local branch QA stubs WAV delivery; production QA separately probes real representative audio URLs.
- app problem data, scoring, UI, and production logic are not modified by the QA itself.
