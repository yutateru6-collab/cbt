const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tools", "listening-player", "index.html"), "utf8");
const player = fs.readFileSync(path.join(root, "tools", "listening-player", "player.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");
const vocabSource = fs.readFileSync(path.join(root, "grade2-vocab-sets.js"), "utf8");
const listeningSource = fs.readFileSync(path.join(root, "grade2-listening-part2-sets.js"), "utf8");
const set01FixSource = fs.readFileSync(path.join(root, "grade2-listening-set01-audio-fixes.js"), "utf8");

const productionSetKeys = ["set-01", "set-02", "set-03"];

function loadProductionListeningSets() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(vocabSource, context, { filename: "grade2-vocab-sets.js" });
  vm.runInContext(listeningSource, context, { filename: "grade2-listening-part2-sets.js" });
  vm.runInContext(set01FixSource, context, { filename: "grade2-listening-set01-audio-fixes.js" });
  return Object.fromEntries(
    context.window.scbtGrade2VocabSets
      .filter((set) => productionSetKeys.includes(set.key))
      .map((set) => [set.key, set]),
  );
}

test("Listening Player stays isolated from the CBT runtime", () => {
  assert.match(html, /\.\.\/\.\.\/grade2-vocab-sets\.js/);
  assert.match(html, /\.\.\/\.\.\/grade2-listening-part2-sets\.js/);
  assert.match(html, /\.\.\/\.\.\/grade2-listening-set01-audio-fixes\.js/);
  assert.doesNotMatch(html, /(?:^|["'])\.\.\/\.\.\/app\.js/);
  assert.ok(
    html.indexOf("../../grade2-vocab-sets.js") <
      html.indexOf("../../grade2-listening-part2-sets.js"),
    "vocab sets must load before listening sets",
  );
  assert.ok(
    html.indexOf("../../grade2-listening-part2-sets.js") <
      html.indexOf("../../grade2-listening-set01-audio-fixes.js"),
    "targeted audio fixes must load after the baseline listening data",
  );
  assert.ok(
    html.indexOf("../../grade2-listening-set01-audio-fixes.js") <
      html.indexOf("./player.js"),
    "audio fixes must be applied before the player reads question.audioFile",
  );
  assert.equal(
    (html.match(/<audio\b/g) || []).length,
    1,
    "the page must contain exactly one persistent audio element",
  );
  assert.doesNotMatch(
    player,
    /new\s+Audio\s*\(/,
    "the player must reuse the single HTML audio element on iPhone",
  );
});

test("Listening Player consumes shared production question data and resolves app-root audio overrides", () => {
  assert.match(player, /window\.scbtGrade2VocabSets/);
  assert.match(player, /question\.audioFile/);
  assert.match(
    player,
    /const APP_ROOT_URL = new URL\("\.\.\/\.\.\/", window\.location\.href\);/,
  );
  assert.match(player, /return new URL\(appRelative, APP_ROOT_URL\)\.href;/);
  assert.doesNotMatch(player, /20260724-simba32/);
  assert.doesNotMatch(player, /pub-6e10f4d8b90b42c79b09bec4ee876a01\.r2\.dev/);

  const sets = loadProductionListeningSets();
  for (const id of [1, 2, 3, 4, 5]) {
    const question = sets["set-01"].listeningQuestions.find(
      (item) => Number(item.id) === id,
    );
    assert.equal(
      question.audioRelease,
      "20260817-set01-listening-q1-q5-question-gap-v1",
      `Set 01 No.${id} must keep the latest Question-gap production correction`,
    );
    assert.match(
      question.audioFile,
      /^\.\/audio-r2\/grade2\/releases\/20260817-set01-listening-q1-q5-question-gap-v1\//,
    );
  }

  for (const id of [6, 7, 8, 9]) {
    const question = sets["set-01"].listeningQuestions.find(
      (item) => Number(item.id) === id,
    );
    assert.equal(
      question.audioRelease,
      "20260817-set01-listening-q5-q9-fix-v1",
      `Set 01 No.${id} must keep the existing targeted production correction`,
    );
    assert.match(
      question.audioFile,
      /^\.\/audio-r2\/grade2\/releases\/20260817-set01-listening-q5-q9-fix-v1\//,
    );
  }
});

test("all 90 paid listening questions contain a displayable answer and explanation", () => {
  const sets = loadProductionListeningSets();
  let total = 0;

  for (const setKey of productionSetKeys) {
    const questions = sets[setKey]?.listeningQuestions;
    assert.ok(Array.isArray(questions), `${setKey} listeningQuestions must exist`);
    assert.equal(questions.length, 30, `${setKey} must contain 30 questions`);

    for (const question of questions) {
      const choices = Array.isArray(question.choices) ? question.choices : [];
      const correct = Number(question.correct);
      assert.equal(choices.length, 4, `${setKey} No.${question.id} must have 4 choices`);
      assert.ok(
        Number.isInteger(correct) && correct >= 1 && correct <= choices.length,
        `${setKey} No.${question.id} must have a valid correct answer`,
      );
      assert.ok(
        String(choices[correct - 1] || "").trim(),
        `${setKey} No.${question.id} correct choice text must exist`,
      );
      assert.ok(
        typeof question.explanation === "string" && question.explanation.trim(),
        `${setKey} No.${question.id} explanation must exist`,
      );
      total += 1;
    }
  }

  assert.equal(total, 90);
});

test("Listening Player renders the shared correct answer and explanation", () => {
  assert.match(html, /id="answer-text"/);
  assert.match(html, /id="explanation-text"/);
  assert.match(player, /Number\(question\.correct\)/);
  assert.match(player, /question\.explanation/);
  assert.match(player, /class="\$\{isCorrect \? "correct-choice" : ""\}"/);
  assert.match(player, /class="correct-badge">正解/);
});

test("Worker build publishes the isolated Listening Player files", () => {
  assert.match(worker, /tools\/listening-player\/index\.html/);
  assert.match(worker, /tools\/listening-player\/player\.css/);
  assert.match(worker, /tools\/listening-player\/player\.js/);
  assert.doesNotMatch(
    worker,
    /assets\/audio\/grade2\/set-01\/listening\/part1\/No05\.wav/,
  );
});
