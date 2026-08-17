# Grade 2 explanation source of truth

## Purpose

Grade 2 content is assembled from several JavaScript files. Raw question files may contain legacy `explanation` values that are not suitable for learner-facing display. Consumers must not decide independently which explanation is newest or correct.

The canonical explanation pipeline is the only supported source for learner-facing explanations.

## Canonical load order

1. `grade2-set-01.js`
2. `grade2-vocab-sets.js`
3. `grade2-speaking-sets.js`
4. `grade2-listening-part2-sets.js`
5. `grade2-listening-set01-audio-fixes.js`
6. `grade2-legacy-explanation-cleanup.js`
7. `grade2-set-01-explanations.js`
8. `grade2-skill-explanations.js`
9. `grade2-explanation-sync.js`
10. `grade2-canonical-explanations.js`

`grade2-canonical-explanations.js` runs last and publishes a post-resolution snapshot as `window.Grade2CanonicalContent`.

## Consumer rule

Do not use raw `question.explanation` from `grade2-listening-part2-sets.js` or any other raw question source as an independent source of truth.

Use:

- `window.Grade2CanonicalContent.sets` for paid-set data.
- `question.canonicalExplanation` for learner-facing explanations.
- `question.questionKey` as the stable cross-app identity.
- `question.explanationSource` to identify which source produced the final explanation.
- `question.explanationVersion` and `question.explanationHash` to verify that two consumers display the same explanation.

Example key:

`grade2:set-01:listening:01`

## Legacy listening explanations

Raw Listening `explanation` values are legacy input. `grade2-legacy-explanation-cleanup.js` deletes those values at runtime before detailed explanations are rebuilt.

This is deliberate: a missing canonical explanation must never silently fall back to an old generic explanation.

After all consumers have migrated and repository-wide checks confirm there are no remaining direct dependencies on the raw Listening explanations, those legacy source fields can be physically removed from the raw data file in a separate cleanup change.

## Fail-closed behavior

For paid sets, canonical resolution blocks learner-facing output when an explanation fails the required checks.

Paid Listening explanations must contain:

- `【聞き取りの決め手】`
- `【誤答分析】` or `【誤答の見分け方】`

Known generic legacy patterns are rejected.

The paid Reading + Listening contract is exactly 305 questions:

- Reading: 31 × 5 = 155
- Listening: 30 × 5 = 150
- Total: 305

## Deployment contract

The Worker bundle and service worker must include the complete explanation pipeline, including:

- `grade2-legacy-explanation-cleanup.js`
- `grade2-set-01-explanations.js`
- `grade2-skill-explanations.js`
- `grade2-explanation-sync.js`
- `grade2-canonical-explanations.js`

A deployment must fail validation if these assets are missing.

## Derived applications

The main CBT and `tools/listening-player/` must consume the same canonical snapshot. New mini apps or exports should do the same instead of reading raw question files and assuming their `explanation` field is final.

When comparing two applications, matching `questionKey` + `explanationHash` means they are displaying the same canonical explanation version.
