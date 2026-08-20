const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");
const styleSource = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
const examSource = fs.readFileSync(path.resolve(__dirname, "..", "exam.html"), "utf8");
const serviceWorkerSource = fs.readFileSync(path.resolve(__dirname, "..", "sw.js"), "utf8");
const examServiceWorkerSource = fs.readFileSync(path.resolve(__dirname, "..", "sw-set02-v2.js"), "utf8");

test("speaking flow includes all new spoken instructions and the common 650 ms gap", () => {
  for (const id of ["grade-introduction", "warmup-introduction", "card-introduction", "section-finish"]) {
    assert.match(appSource, new RegExp(`id: "${id}"`));
  }
  assert.match(appSource, /await waitForGrade2Speaking\(650\);[\s\S]+if \(step\.recording\)/);
  assert.match(appSource, /await speakGrade2Prompt\([\s\S]+getGrade2SpeakingAudioUrl\("common", choice === "yes" \? "why" : "why-not"\)[\s\S]+await waitForGrade2Speaking\(650\)/);
});

test("speaking completion offers the required paths and five semantic recordings", () => {
  for (const text of [
    "そのままリスニングへ進む（本番形式）",
    "一旦休憩する（練習用・本番には休憩なし）",
    "採点用5音声をまとめてダウンロード",
    "スピーキング単体のAI振り返り用プロンプトをコピー",
  ]) {
    assert.ok(appSource.includes(text));
  }
  for (const id of ["read-aloud", "no-1", "no-2", "no-3", "no-4"]) {
    assert.ok(appSource.includes(`"${id}": "${id}"`));
  }
  assert.ok(appSource.includes("聞き取れない箇所を推測して補わない"));
  assert.ok(appSource.includes("各0〜5点、合計20点"));
});

test("developer navigation never suppresses speaking auto-start", () => {
  assert.match(appSource, /id: "silent-reading",[\s\S]+seconds: Number\(silentReading\.seconds\) \|\| 20,[\s\S]+autoStart: true,[\s\S]+timed: true/);
  assert.doesNotMatch(appSource, /speakingDevSuppressAutoStartOnce|shouldSuppressGrade2SpeakingAutoStart/);
  assert.match(appSource, /function mountGrade2SpeakingStep\(\)[\s\S]+beginGrade2SpeakingStep\(\)\.catch/);
  assert.match(appSource, /startGrade2SpeakingTimer\(step\.seconds, "counting"\);/);
  assert.match(appSource, /async function finishGrade2TimedStep\(\)[\s\S]+await advanceGrade2SpeakingStep\(\);/);
});

test("listening exam and review modes use separate replay rules", () => {
  assert.ok(appSource.includes("listeningPlayedQuestionIds"));
  assert.ok(appSource.includes("listeningReviewMode"));
  assert.ok(appSource.includes("hasPlayedListeningQuestion(question.id)"));
  assert.ok(appSource.includes("canNavigateListening = appState.listeningReviewMode || isGrade2DeveloperMode"));
  assert.ok(appSource.includes('data-action="listen-review-open"'));
  assert.ok(appSource.includes("playListeningAudio({ force: appState.listeningReviewMode })"));
});

test("listening countdown starts after question audio ends, stays visible, and advances once", () => {
  assert.match(appSource, /utterance\.addEventListener\(\s*"end",[\s\S]*?startListeningAnswerCountdown\(\);/);
  assert.match(appSource, /audio\.addEventListener\("ended",[\s\S]*?startListeningAnswerCountdown\(\);/);
  assert.match(appSource, /function startListeningAnswerCountdown\(question = getListeningCountdownQuestion\(\)\)/);
  assert.match(appSource, /listeningCountdownQuestionId = question\.id/);
  assert.match(appSource, /setTimeout\(\(\) => finishListeningAnswerCountdownAtZero\(questionId, deadline\), delay\)/);
  assert.match(appSource, /function finishListeningAnswerCountdownAtZero\(questionId, deadline\)/);
  const zeroHandoff = appSource.slice(appSource.indexOf("function finishListeningAnswerCountdownAtZero"), appSource.indexOf("\nfunction advanceListeningAfterCountdown"));
  assert.match(zeroHandoff, /listeningCountdownZeroHandoffKey = handoffKey;[\s\S]*?appState\.listeningAnswerRemaining = 0;[\s\S]*?updateListeningPlaybackUi\(\);/);
  assert.match(zeroHandoff, /const queueAdvanceAfterZeroPaint = \(\) => \{[\s\S]*?requestAnimationFrame\(advanceAfterZeroPaint\);/);
  assert.match(zeroHandoff, /listeningCountdownZeroFrame = requestAnimationFrame\(queueAdvanceAfterZeroPaint\);/);
  assert.match(zeroHandoff, /setTimeout\(advanceAfterZeroPaint, 120\)/);
  assert.match(appSource, /function advanceListeningAfterCountdown\(questionId, deadline\)/);
  assert.match(appSource, /listeningCountdownAdvanceKey === advanceKey/);
  assert.match(appSource, /String\(appState\.listeningCountdownQuestionId\) !== String\(questionId\)/);
  assert.match(appSource, /"次の問題まで"/);
  assert.match(appSource, /data-listening-answer-bar/);
  assert.match(styleSource, /\.answer-time\.is-countdown\s*\{/);
  assert.match(styleSource, /padding: 14px 12px calc\(132px \+ env\(safe-area-inset-bottom\)\);/);
});

test("stale listening play rejections cannot overwrite a newer playback phase", () => {
  const instructionPlay = appSource.match(/await instructionAudio\.play\(\);[\s\S]*?return true;/)?.[0] || "";
  assert.match(instructionPlay, /listeningInstructionAudioElement !== instructionAudio/);
  assert.match(instructionPlay, /listeningPlaybackQuestionId !== question\.id/);
  assert.match(instructionPlay, /listeningPlaybackToken !== playbackToken/);
  const questionPlay = appSource.match(/await audio\.play\(\);[\s\S]*?\n\}/)?.[0] || "";
  assert.match(questionPlay, /listeningAudioElement !== audio/);
  assert.match(questionPlay, /listeningPlaybackQuestionId !== question\.id/);
  assert.match(questionPlay, /listeningAudioPlaybackToken !== playbackToken/);
  assert.match(questionPlay, /listeningPlaybackToken !== playbackToken/);
});

test("listening countdown resumes by deadline without replaying audio and excludes review mode", () => {
  assert.match(appSource, /stopListeningPlayback\(\{ preserveCountdown: true \}\);/);
  assert.match(appSource, /const resumingCountdown = isListeningAnswerCountdownActive\(question\);/);
  assert.match(appSource, /else if \(resumingCountdown\) \{[\s\S]*?listeningPlaybackPhase = "answer";/);
  assert.match(appSource, /if \(!question \|\| appState\.listeningReviewMode\) return;/);
  assert.match(appSource, /if \(appState\.listeningReviewMode \|\| \["review", "review-answer"\]\.includes\(listeningPlaybackPhase\)\) return;/);
  assert.match(appSource, /hasPlayedListeningQuestion\(question\.id\)[\s\S]*?listeningPlaybackPhase = "review-answer"/);
});

test("listening answer panel separates both parts into two-column sections", () => {
  assert.match(appSource, /label: "第1部", questions: indexedQuestions\.slice\(0, 15\)/);
  assert.match(appSource, /label: "第2部", questions: indexedQuestions\.slice\(15, 30\)/);
  assert.match(styleSource, /\.listen-section-grid\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Part 2 instruction is forced at the No.15 to No.16 boundary", () => {
  assert.match(appSource, /currentSection === "part1" && nextSection === "part2"/);
  assert.match(appSource, /delete appState\.listeningIntroducedSections\.part2/);
  assert.match(appSource, /playGrade2ListeningInstruction\(question\)/);
  assert.ok(appSource.includes('part2: `${GRADE2_SPEAKING_AUDIO_BASE}/instructions/listening-part2-ja.wav`'));
});

test("exam assets and both service workers use the current mobile and listening cache releases", () => {
  assert.match(examSource, /styles\.css\?v=grade2-reading-writing-listening-v73-mobile-dev/);
  assert.match(examSource, /app\.js\?v=grade2-reading-writing-listening-v73-mobile-dev/);
  assert.match(examSource, /sw-set02-v2\.js\?v=grade2-set03-listening-fixes-20260821-v1/);
  assert.match(serviceWorkerSource, /cbt-grade2-app-shell-v81-set03-listening-fixes/);
  assert.match(examServiceWorkerSource, /cbt-grade2-app-shell-v81-set03-listening-fixes/);
});

test("Grade 2 developer mobile controls stay inside the viewport with touch-sized targets", () => {
  const mobileDeveloperStyles = styleSource.slice(styleSource.lastIndexOf("@media (max-width: 767px)"));
  assert.match(appSource, /class="developer-toolbar-label">回次<\/span>/);
  assert.match(appSource, /class="developer-toolbar-label">技能<\/span>/);
  assert.match(appSource, /data-action="dev-result"/);
  assert.match(appSource, /data-action="speaking-dev-skip-checks"/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode\s*\{[\s\S]*?overflow-x: hidden;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.module-picker\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);[\s\S]*?overflow: visible;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.module-picker \.font-size-control\s*\{[\s\S]*?min-height: 44px;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.developer-toolbar-row\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.developer-toolbar-row\.developer-set-row\s*\{[\s\S]*?grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.developer-toolbar-row:not\(\.developer-set-row\) \[data-action="dev-result"\]\s*\{[\s\S]*?grid-column: 1 \/ -1;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.developer-toolbar button,[\s\S]*?min-height: 44px;[\s\S]*?font-size: 16px;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.developer-location-picker select\s*\{[\s\S]*?max-width: 100%;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.speaking-dev-actions\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.speaking-dev-actions \[data-action="speaking-dev-skip-checks"\]\s*\{[\s\S]*?grid-column: 1 \/ -1;/);
  assert.match(mobileDeveloperStyles, /body\.grade2-developer-mode \.speaking-dev-actions button\s*\{[\s\S]*?min-height: 44px;/);
});

test("font size keeps level 1 unchanged and expands through level 6", () => {
  assert.match(appSource, /const FONT_LEVEL_MAX = 6;/);
  assert.match(appSource, /Math\.min\(FONT_LEVEL_MAX, \(Number\(appState\.fontLevel\) \|\| 1\) \+ 1\)/);
  assert.match(appSource, /state\.fontLevel = Math\.min\(FONT_LEVEL_MAX, Math\.max\(1,/);
  assert.match(styleSource, /\.app-shell\[data-font-level="6"\]\s*\{\s*--question-font-bump: 7\.5px;/);
  assert.match(styleSource, /--question-font-bump: 0px;/);
});

test("writing uses a larger editor, a scrollable full view, and blocks clipboard insertion", () => {
  assert.doesNotMatch(appSource, /data-action="(?:copy-writing|paste-demo)"/);
  assert.doesNotMatch(appSource, /clipboardText/);
  for (const eventName of ["copy", "cut", "paste", "dragover", "drop", "beforeinput", "keydown", "keyup"]) {
    assert.ok(appSource.includes(`app.addEventListener("${eventName}"`));
  }
  for (const inlineEvent of ["oncopy", "oncut", "onpaste", "ondragover", "ondrop"]) {
    assert.ok(appSource.includes(`${inlineEvent}="return false"`));
  }
  for (const inputType of ["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "deleteByCut"]) {
    assert.ok(appSource.includes(`"${inputType}"`));
  }
  assert.match(appSource, /\(event\.ctrlKey \|\| event\.metaKey\)[\s\S]+\["c", "x", "v"\]/);
  assert.match(appSource, /event\.target\.value = blockedWritingEdit\?\.value \?\? appState\.writingAnswers\[id\]/);
  assert.ok(appSource.includes('oninput="return guardWritingInlineInput(event)"'));
  assert.match(styleSource, /\.writing-textarea\s*\{[\s\S]*?height: 340px;/);
  assert.match(styleSource, /\.writing-full-scroll\s*\{[\s\S]*?overflow-y: auto;/);
});

test("Grade 2 Part 3B focuses paragraphs for No.27-30 and keeps No.31 and full view complete", () => {
  assert.match(appSource, /hasExpectedQuestions[\s\S]+"27,28,29,30,31"/);
  assert.match(appSource, /questionIndex >= 0 && questionIndex < 4/);
  assert.match(appSource, /return \{ passage: \[passage\[questionIndex\]\], label: `第\$\{questionIndex \+ 1\}段落` \}/);
  assert.match(appSource, /return \{ passage, label: "全文（第1〜4段落）" \}/);
  assert.match(appSource, /function renderReadingFullView\(page\)[\s\S]+renderPassageCard\(page, "full-passage-card"\)/);
});

test("all six Grade 2 sets keep the four-paragraph, five-question Part 3B contract", () => {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ["grade2-set-01.js", "grade2-vocab-sets.js"]) {
    vm.runInContext(fs.readFileSync(path.resolve(__dirname, "..", file), "utf8"), context, { filename: file });
  }
  const sets = [context.window.scbtGrade2Set01, ...context.window.scbtGrade2VocabSets];
  assert.equal(sets.length, 6);
  for (const set of sets) {
    const page = set.readingPages.find((item) => String(item.label).includes("3B"));
    assert.ok(page, `${set.setId || set.key}: Part 3B missing`);
    assert.equal(page.passage.length, 4, `${set.setId || set.key}: paragraph count`);
    assert.deepEqual(Array.from(page.questions, (question) => question.id), [27, 28, 29, 30, 31], `${set.setId || set.key}: question ids`);
  }
});
