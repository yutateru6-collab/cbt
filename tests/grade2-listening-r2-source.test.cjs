const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const dataSource = fs.readFileSync(path.join(root, "grade2-listening-part2-sets.js"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");

const ACTIVE_RELEASE = "20260815-grade2-listening-pauses-v2";
const ACTIVE_BASE = `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${ACTIVE_RELEASE}`;
const SET03_FIX_RELEASE = "20260821-set03-listening-fixes-v1";
const SET03_FIX_BASE = `https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/${SET03_FIX_RELEASE}`;
const set03FixNumbers = new Set([11, 13, 15, 29]);
const productionSetKeys = ["set-01", "set-02", "set-03"];

function loadListeningSets() {
  const window = {
    scbtGrade2VocabSets: productionSetKeys.map((key) => ({ key, availableModules: [] })),
    scbtGrade2Set01: {},
  };
  vm.runInNewContext(dataSource, { window }, { filename: "grade2-listening-part2-sets.js" });
  return Object.fromEntries(window.scbtGrade2VocabSets.map((set) => [set.key, set]));
}

test("Grade 2 three-run production uses 86 pauses-v2 URLs plus four corrected Set 3 URLs", () => {
  const sets = loadListeningSets();
  let total = 0;
  let correctedTotal = 0;

  for (const setKey of productionSetKeys) {
    const questions = sets[setKey]?.listeningQuestions;
    assert.ok(Array.isArray(questions), `${setKey} listeningQuestions must exist`);
    assert.equal(questions.length, 30, `${setKey} must contain 30 listening questions`);
    assert.deepEqual(
      Array.from(questions, (question) => Number(question.id)),
      Array.from({ length: 30 }, (_, index) => index + 1),
      `${setKey} must contain No.1 through No.30 in order`,
    );

    for (const question of questions) {
      const partFolder = question.part === "Part 1" ? "part1" : "part2";
      const number = String(question.id).padStart(2, "0");
      const usesSet03Fix = setKey === "set-03" && set03FixNumbers.has(question.id);
      const expectedBase = usesSet03Fix ? SET03_FIX_BASE : ACTIVE_BASE;
      const expectedUrl = `${expectedBase}/${setKey}/listening/${partFolder}/No${number}.wav`;
      assert.equal(
        question.audioFile,
        expectedUrl,
        `${setKey} No.${question.id} must use its active immutable R2 release`,
      );
      assert.ok(!question.audioFile.includes("/assets/audio/"), `${setKey} No.${question.id} must not use local audio`);
      if (usesSet03Fix) correctedTotal += 1;
      total += 1;
    }
  }

  assert.equal(total, 90);
  assert.equal(correctedTotal, 4);
});

test("Worker package no longer ships the legacy local Set 1 No.5 WAV", () => {
  assert.doesNotMatch(
    workerSource,
    /assets\/audio\/grade2\/set-01\/listening\/part1\/No05\.wav/,
  );
});
