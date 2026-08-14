const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(root, "grade2-speaking-sets.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context, { filename: "grade2-speaking-sets.js" });
const sets = context.window.scbtGrade2SpeakingSets;

test("all six speaking sets have the required No.2 storyboard structure", () => {
  assert.deepEqual(
    Array.from(sets, (set) => set.key),
    ["sample", "set-01", "set-02", "set-03", "set-04", "set-05"],
  );
  for (const set of sets) {
    const no2 = set.speakingSteps.find((step) => step.label === "No.2");
    assert.ok(no2.pictureStory.openingSentence);
    assert.ok(no2.pictureStory.firstSpeech);
    assert.ok(no2.pictureStory.firstTimeLabel);
    assert.ok(no2.pictureStory.secondTimeLabel);
    assert.match(no2.pictureStory.imageSrc, /-v3\.png$/);
    assert.ok(fs.existsSync(path.join(root, no2.pictureStory.imageSrc)));
  }
});

test("No.3 uses the fixed Some people say structure in every set", () => {
  for (const set of sets) {
    const question = set.speakingSteps.find((step) => step.label === "No.3").questionText;
    assert.match(question, /^Some people say that .+ What do you think about that\?$/);
  }
  const questions = sets.map((set) => set.speakingSteps.find((step) => step.label === "No.3").questionText);
  assert.ok(questions.some((question) => /will .* in the future/.test(question)), "future prediction missing");
  assert.ok(questions.some((question) => /local governments should/.test(question)), "policy type missing");
  assert.ok(questions.some((question) => /better than/.test(question)), "comparison type missing");
});

test("No.4 has a situation sentence followed by Do you think", () => {
  const questions = sets.map((set) => set.speakingSteps.find((step) => step.label === "No.4").questionText);
  for (const question of questions) {
    assert.match(question, /^(Today|Nowadays|These days), .+\. Do you think .+\?$/);
    assert.equal((question.match(/\?/g) || []).length, 1);
  }
  assert.equal(new Set(questions).size, 6);
});
