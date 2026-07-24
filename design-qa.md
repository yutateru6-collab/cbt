# Grade 2 Speaking Card V2 Design QA

- source visual truth path: `C:\Users\OwnerPC\AppData\Local\Temp\codex-clipboard-43da42ca-fa17-429b-a542-9dae1f7289ee.png`
- implementation screenshot path: `C:\Users\OwnerPC\.codex\visualizations\2026\07\14\019f5f70-1b15-7191-b579-276432820ee1\grade2-speaking-card-v2-loaded-20260718.png`
- focused asset path: `D:\Users\OwnerPC\Documents\scbtアプリ\assets\grade2-speaking-picture-story-02.png`
- viewport: 1712 x 1280
- state: Grade 2 / Speaking / No. 2 preparation / 20-second countdown

## Full-view comparison evidence

The V2 card now places the passage title and body, underlined opening sentence, and three-panel sequence on the same white problem card. The illustration is a compact monochrome horizontal strip. The speech bubble identifies the father as the speaker, and both time labels sit at the panel transitions. The surrounding timer and controls intentionally remain part of the nonofficial S-CBT practice interface.

## Focused comparison evidence

A separate browser crop was not required because the complete card is legible in the 1712 x 1280 implementation capture. The original raster asset was also opened at full resolution to verify character continuity, the loose bottle cap, spill, panel borders, and monochrome line quality.

## Required fidelity surfaces

- Fonts and typography: serif passage typography, italic centered title, bold underlined opening sentence, and compact sans-serif overlay labels reproduce the reference hierarchy closely enough for the practice UI.
- Spacing and layout rhythm: passage, opening sentence, and strip use the same top-to-bottom order as the reference. The strip is substantially wider and shorter than V1 and fits without clipping.
- Colors and visual tokens: the card is neutral black, white, and gray. The blue timer UI remains outside the problem card and is an intentional product-level difference.
- Image quality and asset fidelity: the V2 raster is sharp, monochrome, has exactly three panels, and uses consistent characters and props. No placeholder art remains.
- Copy and content: the opening sentence, first speech, and both transitions are readable and consistent with the illustrated sequence. The image alt text no longer reveals the answer.

## Comparison history

### Iteration 1 findings

- P1: V1 omitted the passage from the No. 2 card.
- P1: V1 used tall, full-color panels rather than a compact monochrome strip.
- P1: The third-panel leak cause was not visually clear.
- P2: The opening sentence was not underlined.
- P2: Time labels and the speaker bubble did not read as clearly as the reference.

### Fixes made

- Added the passage title and full passage to the No. 2 problem card.
- Replaced the image with a purpose-built monochrome three-panel raster.
- Made the loose cap and leaking liquid explicit in panel 3.
- Underlined the full opening sentence.
- Repositioned the speech bubble tail and transition arrows.
- Updated service-worker and page asset versions so the browser loads V2.

### Post-fix evidence

The browser capture `grade2-speaking-card-v2-loaded-20260718.png` shows all five fixes in the target No. 2 preparation state. No actionable P0, P1, or P2 visual mismatch remains within the intended nonofficial practice-card scope.

## Follow-up polish

- P3: Future question sets should rotate among stories with and without wordless thought scenes.
- P3: The exact current S-CBT production chrome is not publicly available, so the outer practice interface remains intentionally original.

final result: passed
