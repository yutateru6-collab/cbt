const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const appSource = fs.readFileSync(path.resolve(__dirname, "..", "app.js"), "utf8");

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
    "ChatGPT採点用プロンプトをコピー",
  ]) {
    assert.ok(appSource.includes(text));
  }
  for (const id of ["read-aloud", "no-1", "no-2", "no-3", "no-4"]) {
    assert.ok(appSource.includes(`"${id}": "${id}"`));
  }
  assert.ok(appSource.includes("聞き取れない箇所を推測して補わない"));
  assert.ok(appSource.includes("各0〜5点、合計20点"));
});

test("silent reading auto-starts even when selected from developer navigation", () => {
  assert.match(appSource, /id: "silent-reading",[\s\S]+seconds: Number\(silentReading\.seconds\) \|\| 20,[\s\S]+autoStart: true,[\s\S]+timed: true/);
  assert.match(appSource, /function shouldSuppressGrade2SpeakingAutoStart\(step\) \{\s+return step\?\.id !== "silent-reading";\s+\}/);
  assert.match(appSource, /startGrade2SpeakingTimer\(step\.seconds, "counting"\);/);
  assert.match(appSource, /async function finishGrade2TimedStep\(\)[\s\S]+await advanceGrade2SpeakingStep\(\);/);
});

test("listening exam and review modes use separate replay rules", () => {
  assert.ok(appSource.includes("listeningPlayedQuestionIds"));
  assert.ok(appSource.includes("listeningReviewMode"));
  assert.ok(appSource.includes("hasPlayedListeningQuestion(question.id)"));
  assert.ok(appSource.includes("canNavigateListeningList = appState.listeningReviewMode || isGrade2DeveloperMode"));
  assert.ok(appSource.includes('data-action="listen-review-open"'));
  assert.ok(appSource.includes("playListeningAudio({ force: appState.listeningReviewMode })"));
});
