const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "tools", "listening-player", "index.html"), "utf8");
const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
const player = fs.readFileSync(path.join(root, "tools", "listening-player", "player.js"), "utf8");
const worker = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");
const serviceWorker = fs.readFileSync(path.join(root, "sw-set02-v2.js"), "utf8");
const vocabSource = fs.readFileSync(path.join(root, "grade2-vocab-sets.js"), "utf8");
const speakingSource = fs.readFileSync(path.join(root, "grade2-speaking-sets.js"), "utf8");
const listeningSource = fs.readFileSync(path.join(root, "grade2-listening-part2-sets.js"), "utf8");
const audioOverrideSource = fs.readFileSync(path.join(root, "grade2-listening-set01-audio-fixes.js"), "utf8");
const cleanupSource = fs.readFileSync(path.join(root, "grade2-legacy-explanation-cleanup.js"), "utf8");
const set01ExplanationSource = fs.readFileSync(path.join(root, "grade2-set-01-explanations.js"), "utf8");
const skillExplanationSource = fs.readFileSync(path.join(root, "grade2-skill-explanations.js"), "utf8");
const explanationSyncSource = fs.readFileSync(path.join(root, "grade2-explanation-sync.js"), "utf8");
const canonicalSource = fs.readFileSync(path.join(root, "grade2-canonical-explanations.js"), "utf8");

const productionSetKeys = ["set-01", "set-02", "set-03"];
const allPaidSetKeys = ["set-01", "set-02", "set-03", "set-04", "set-05"];
const THREE_SET_RELEASE = "20260817-grade2-sets01-03-listening-pauses-1s-v1";
const DUPLICATE_FIX_RELEASE = "20260817-set01-listening-duplicate-question-fix-v1";
const DUPLICATE_FIX_IDS = new Set([6, 7, 8, 10, 12, 14]);

function loadCanonicalGrade2Data() {
  const context = { window: {}, Set };
  vm.createContext(context);
  vm.runInContext(vocabSource, context, { filename: "grade2-vocab-sets.js" });
  vm.runInContext(speakingSource, context, { filename: "grade2-speaking-sets.js" });
  vm.runInContext(listeningSource, context, { filename: "grade2-listening-part2-sets.js" });
  vm.runInContext(audioOverrideSource, context, { filename: "grade2-listening-set01-audio-fixes.js" });

  const rawSet01Question1 = context.window.scbtGrade2VocabSets
    .find((set) => set.key === "set-01")
    .listeningQuestions.find((question) => Number(question.id) === 1);
  const rawExplanation = rawSet01Question1.explanation;

  vm.runInContext(cleanupSource, context, { filename: "grade2-legacy-explanation-cleanup.js" });
  const removedByCleanup = context.window.GRADE2_LEGACY_LISTENING_EXPLANATIONS_REMOVED.removed;
  vm.runInContext(set01ExplanationSource, context, { filename: "grade2-set-01-explanations.js" });
  vm.runInContext(skillExplanationSource, context, { filename: "grade2-skill-explanations.js" });
  vm.runInContext(explanationSyncSource, context, { filename: "grade2-explanation-sync.js" });
  vm.runInContext(canonicalSource, context, { filename: "grade2-canonical-explanations.js" });

  const sets = Object.fromEntries(
    context.window.Grade2CanonicalContent.sets.map((set) => [set.key, set]),
  );
  return { context, sets, rawExplanation, removedByCleanup };
}

test("Listening Player stays isolated from app.js but loads the full canonical explanation pipeline", () => {
  for (const file of [
    "../../grade2-vocab-sets.js",
    "../../grade2-speaking-sets.js",
    "../../grade2-listening-part2-sets.js",
    "../../grade2-listening-set01-audio-fixes.js",
    "../../grade2-legacy-explanation-cleanup.js",
    "../../grade2-set-01-explanations.js",
    "../../grade2-skill-explanations.js",
    "../../grade2-explanation-sync.js",
    "../../grade2-canonical-explanations.js",
  ]) {
    assert.ok(html.includes(file), `Listening Player must load ${file}`);
  }
  assert.doesNotMatch(html, /(?:^|["'])\.\.\/\.\.\/app\.js/);
  assert.ok(
    html.indexOf("../../grade2-listening-part2-sets.js") <
      html.indexOf("../../grade2-listening-set01-audio-fixes.js"),
  );
  assert.ok(
    html.indexOf("../../grade2-listening-set01-audio-fixes.js") <
      html.indexOf("../../grade2-legacy-explanation-cleanup.js"),
  );
  assert.ok(
    html.indexOf("../../grade2-explanation-sync.js") <
      html.indexOf("../../grade2-canonical-explanations.js"),
  );
  assert.ok(html.indexOf("../../grade2-canonical-explanations.js") < html.indexOf("./player.js"));
  assert.equal((html.match(/<audio\b/g) || []).length, 1);
  assert.doesNotMatch(player, /new\s+Audio\s*\(/);
});

test("CBT exam resolves canonical explanations before exam-data consumes Grade 2 sets", () => {
  for (const file of [
    "./grade2-legacy-explanation-cleanup.js",
    "./grade2-set-01-explanations.js",
    "./grade2-skill-explanations.js",
    "./grade2-explanation-sync.js",
    "./grade2-canonical-explanations.js",
  ]) {
    assert.ok(examHtml.includes(file), `exam.html must load ${file}`);
  }
  assert.ok(examHtml.indexOf("./grade2-listening-part2-sets.js") < examHtml.indexOf("./grade2-listening-set01-audio-fixes.js"));
  assert.ok(examHtml.indexOf("./grade2-listening-set01-audio-fixes.js") < examHtml.indexOf("./grade2-legacy-explanation-cleanup.js"));
  assert.ok(examHtml.indexOf("./grade2-explanation-sync.js") < examHtml.indexOf("./grade2-canonical-explanations.js"));
  assert.ok(examHtml.indexOf("./grade2-canonical-explanations.js") < examHtml.indexOf("./exam-data.js"));
});

test("raw Grade 2 Listening source contains zero legacy explanation fields", () => {
  assert.doesNotMatch(listeningSource, /^\s*"explanation":/m);
  const { rawExplanation, removedByCleanup } = loadCanonicalGrade2Data();
  assert.equal(rawExplanation, undefined);
  assert.equal(removedByCleanup, 0);
});

test("all 305 paid Reading and Listening questions resolve to canonical explanations", () => {
  const { context, sets } = loadCanonicalGrade2Data();
  const canonical = context.window.Grade2CanonicalContent;
  assert.equal(canonical.ready, true, JSON.stringify(canonical.issues, null, 2));
  assert.equal(canonical.issues.length, 0);
  assert.equal(canonical.paidChoiceCount, 305);

  const seen = new Set();
  let total = 0;
  for (const setKey of allPaidSetKeys) {
    const set = sets[setKey];
    assert.ok(set, `${setKey} must exist`);
    const reading = set.readingPages.flatMap((page) => page.questions || []);
    const listening = set.listeningQuestions || [];
    assert.equal(reading.length, 31, `${setKey} must contain 31 Reading questions`);
    assert.equal(listening.length, 30, `${setKey} must contain 30 Listening questions`);
    for (const question of [...reading, ...listening]) {
      assert.equal(question.explanationStatus, "canonical", `${question.questionKey} status`);
      assert.ok(question.canonicalExplanation.trim(), `${question.questionKey} canonical explanation`);
      assert.ok(question.explanationSource, `${question.questionKey} source`);
      assert.match(question.explanationHash, /^[0-9a-f]{8}$/);
      assert.equal(seen.has(question.questionKey), false, `duplicate ${question.questionKey}`);
      seen.add(question.questionKey);
      total += 1;
    }
  }
  assert.equal(total, 305);
  assert.equal(seen.size, 305);
});

test("paid Listening explanations always contain evidence and distractor analysis", () => {
  const { sets } = loadCanonicalGrade2Data();
  for (const setKey of allPaidSetKeys) {
    for (const question of sets[setKey].listeningQuestions) {
      assert.match(question.canonicalExplanation, /【聞き取りの決め手】/, question.questionKey);
      assert.match(question.canonicalExplanation, /【(?:誤答分析|誤答の見分け方)】/, question.questionKey);
    }
  }
});

test("Set 01 No.1 uses the detailed canonical explanation rebuilt from the approved source", () => {
  const { sets, rawExplanation } = loadCanonicalGrade2Data();
  const question = sets["set-01"].listeningQuestions.find((item) => Number(item.id) === 1);
  assert.equal(rawExplanation, undefined);
  assert.equal(question.questionKey, "grade2:set-01:listening:01");
  assert.equal(question.explanationSource, "grade2-set-01-explanations.js");
  assert.match(question.canonicalExplanation, /Could you upload it from the media room\?/);
  assert.match(question.canonicalExplanation, /【誤答分析】/);
});

test("Listening Player consumes canonical sets and canonicalExplanation only", () => {
  assert.match(player, /window\.Grade2CanonicalContent/);
  assert.match(player, /canonical\?\.ready/);
  assert.match(player, /canonical\.sets/);
  assert.match(player, /question\.canonicalExplanation/);
  assert.match(player, /question\.questionKey/);
  assert.match(player, /question\.explanationSource/);
  assert.match(player, /question\.explanationHash/);
});

test("only the six confirmed Set 01 items use the duplicate-question overlay release", () => {
  const { sets } = loadCanonicalGrade2Data();
  let total = 0;
  let overlayCount = 0;
  for (const setKey of productionSetKeys) {
    const questions = sets[setKey].listeningQuestions;
    assert.equal(questions.length, 30);
    for (const question of questions) {
      const id = Number(question.id);
      const part = id <= 15 ? "part1" : "part2";
      const number = String(id).padStart(2, "0");
      const useOverlay = setKey === "set-01" && part === "part1" && DUPLICATE_FIX_IDS.has(id);
      const expectedRelease = useOverlay ? DUPLICATE_FIX_RELEASE : THREE_SET_RELEASE;
      assert.equal(question.audioRelease, expectedRelease, `${setKey} No.${id} release`);
      assert.equal(
        question.audioFile,
        `./audio-r2/grade2/releases/${expectedRelease}/${setKey}/listening/${part}/No${number}.wav`,
        `${setKey} No.${id} audioFile`,
      );
      if (useOverlay) overlayCount += 1;
      total += 1;
    }
  }
  assert.equal(total, 90);
  assert.equal(overlayCount, 6);
});

test("all 90 Listening Player questions use the same canonical registry entries", () => {
  const { context, sets } = loadCanonicalGrade2Data();
  const registry = context.window.Grade2CanonicalContent.registry;
  let total = 0;
  for (const setKey of productionSetKeys) {
    for (const question of sets[setKey].listeningQuestions) {
      const entry = registry[question.questionKey];
      assert.ok(entry, question.questionKey);
      assert.equal(entry.status, "canonical");
      assert.equal(entry.hash, question.explanationHash);
      assert.equal(entry.source, question.explanationSource);
      total += 1;
    }
  }
  assert.equal(total, 90);
});

test("Worker build and service worker publish/cache every explanation pipeline asset", () => {
  for (const file of [
    "grade2-legacy-explanation-cleanup.js",
    "grade2-set-01-explanations.js",
    "grade2-skill-explanations.js",
    "grade2-explanation-sync.js",
    "grade2-canonical-explanations.js",
  ]) {
    assert.ok(worker.includes(`\"${file}\"`), `worker-dist must include ${file}`);
    assert.ok(serviceWorker.includes(`/${file}`), `service worker must cache ${file}`);
  }
  assert.match(serviceWorker, /grade2-listening-set01-audio-fixes\.js/);
  assert.match(serviceWorker, /url\.pathname\.startsWith\("\/audio-r2\/"\)/);
  assert.match(worker, /tools\/listening-player\/index\.html/);
  assert.match(worker, /tools\/listening-player\/player\.css/);
  assert.match(worker, /tools\/listening-player\/player\.js/);
  assert.doesNotMatch(worker, /assets\/audio\/grade2\/set-01\/listening\/part1\/No05\.wav/);
});
