const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");

const examSource = read("exam.html");
const appSource = read("app.js");
const dataSource = read("grade2-speaking-data-fixes.js");
const runtimeSource = read("grade2-speaking-listening-runtime-fixes.js");
const styleSource = read("grade2-normal-user-fixes.css");
const swSource = read("sw.js");

test("Grade 2 accuracy patches load in the required order", () => {
  const speakingSetsIndex = examSource.indexOf("grade2-speaking-sets.js");
  const dataFixIndex = examSource.indexOf("grade2-speaking-data-fixes.js");
  const examDataIndex = examSource.indexOf("exam-data.js");
  const appIndex = examSource.indexOf("app.js?v=");
  const runtimeFixIndex = examSource.indexOf("grade2-speaking-listening-runtime-fixes.js");

  assert.ok(speakingSetsIndex >= 0 && speakingSetsIndex < dataFixIndex);
  assert.ok(dataFixIndex < examDataIndex);
  assert.ok(appIndex >= 0 && appIndex < runtimeFixIndex);
});

test("Speaking timings are fixed for sample and paid sets without sample-time shortening", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("grade2-speaking-sets.js"), context);
  vm.runInContext(dataSource, context);

  const expected = new Map([
    ["Silent Reading", 20],
    ["Read Aloud", 60],
    ["No.1", 30],
    ["No.2", 90],
    ["No.3", 35],
    ["No.4", 35],
  ]);

  for (const key of ["sample", "set-01", "set-02", "set-03"]) {
    const set = context.window.scbtGrade2SpeakingSets.find((item) => item.key === key);
    assert.ok(set, `${key} must exist`);
    for (const [label, seconds] of expected) {
      const step = set.speakingSteps.find((item) => item.label === label);
      assert.equal(step?.seconds, seconds, `${key} ${label}`);
    }
  }

  for (const [id, seconds] of [
    ["silent-reading", 20],
    ["read-aloud", 60],
    ["no-1", 30],
    ["no-2-preparation", 20],
    ["no-2", 90],
    ["no-3", 35],
    ["no-4", 35],
  ]) {
    assert.match(runtimeSource, new RegExp(`"${id}": ${seconds}`));
  }
});

test("Library No.1 can reconstruct such libraries from an explicit relative clause", () => {
  assert.ok(dataSource.includes("some libraries that have tool-lending programs"));
  assert.ok(dataSource.includes("such libraries → libraries that have tool-lending programs"));
  assert.ok(dataSource.includes("By borrowing tools from libraries that have tool-lending programs."));
});

test("Sets 1 to 3 keep direct passage evidence for No.1", () => {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("grade2-speaking-sets.js"), context);
  vm.runInContext(dataSource, context);
  const byKey = new Map(context.window.scbtGrade2SpeakingSets.map((set) => [set.key, set]));

  const set01 = byKey.get("set-01");
  const set02 = byKey.get("set-02");
  const set03 = byKey.get("set-03");
  assert.ok(set01.speakingSteps.find((step) => step.label === "No.1").modelAnswer.includes("bringing empty bottles"));
  assert.ok(set01.speakingSteps.find((step) => step.label === "No.1").cardText.includes("Customers bring empty bottles"));
  assert.ok(set02.speakingSteps.find((step) => step.label === "No.1").modelAnswer.includes("saving digital tickets"));
  assert.ok(set02.speakingSteps.find((step) => step.label === "No.1").cardText.includes("Visitors save these tickets"));
  assert.ok(set03.speakingSteps.find((step) => step.label === "No.1").modelAnswer.startsWith("Because many older customers"));
  assert.ok(set03.speakingSteps.find((step) => step.label === "No.1").cardText.includes("many older customers are not familiar with such services"));
});

test("Listening volume preserves zero and persists the corrected value", () => {
  assert.ok(runtimeSource.includes("Number.isFinite(numeric)"));
  assert.ok(runtimeSource.includes("return Math.max(0, Math.min(100, numeric))"));
  assert.ok(runtimeSource.includes("output-volume-v2"));
  assert.ok(runtimeSource.includes("return clampVolume(appState.speakingOutputVolume) / 100"));
  assert.ok(runtimeSource.includes("listeningAudioElement.volume = effectiveListeningVolume"));
  assert.ok(runtimeSource.includes("listeningInstructionAudioElement.volume = effectiveListeningVolume"));
});

test("PC listening navigation is Part 1 left and Part 2 right with all 30 number slots", () => {
  assert.match(styleSource, /@media \(min-width: 768px\)[\s\S]*?\.listen-list\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styleSource, /@media \(min-width: 768px\)[\s\S]*?\.listen-section-grid\s*\{[\s\S]*?grid-template-columns: 1fr/);
  assert.ok(runtimeSource.includes('renderListeningSectionColumn("第1部", "part1", 1, 15'));
  assert.ok(runtimeSource.includes('renderListeningSectionColumn("第2部", "part2", 16, 30'));
  assert.ok(runtimeSource.includes("renderUnavailableListeningRow(id)"));
});

test("Speaking completion keeps bulk and individual recording downloads", () => {
  assert.ok(appSource.includes("採点用5音声をまとめてダウンロード"));
  assert.ok(appSource.includes("個別ダウンロード"));
  assert.ok(appSource.includes("downloadAllGrade2SpeakingRecordings"));
  assert.ok(appSource.includes("downloadSpeakingRecording"));
});

test("Service worker refreshes timing and UI runtime assets before stale cache", () => {
  assert.ok(swSource.includes("v88-speaking-listening-accuracy"));
  for (const asset of [
    "/app.js",
    "/styles.css",
    "/grade2-normal-user-fixes.css",
    "/grade2-speaking-sets.js",
    "/grade2-speaking-data-fixes.js",
    "/grade2-speaking-listening-runtime-fixes.js",
  ]) {
    assert.ok(swSource.includes(`"${asset}"`), asset);
  }
  assert.ok(swSource.includes("NETWORK_FIRST_RUNTIME_PATHS.has(url.pathname)"));
  assert.ok(swSource.includes("fetchAndRefreshRuntime(request)"));
});
