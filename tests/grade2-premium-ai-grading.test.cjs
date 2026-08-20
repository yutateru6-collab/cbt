const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const bonusHtml = fs.readFileSync(path.join(root, "bonus.html"), "utf8");
const bonusCss = fs.readFileSync(path.join(root, "bonus.css"), "utf8");
const bonusScript = fs.readFileSync(path.join(root, "grade2-premium-bonus.js"), "utf8");
const flowSource = fs.readFileSync(path.join(root, "grade2-ai-grading-flow.js"), "utf8");
const flowCss = fs.readFileSync(path.join(root, "grade2-ai-grading-flow.css"), "utf8");
const developerShortcutSource = fs.readFileSync(path.join(root, "grade2-developer-score-shortcut.js"), "utf8");
const developerShortcutCss = fs.readFileSync(path.join(root, "grade2-developer-score-shortcut.css"), "utf8");
const prepareWorkerAssetsSource = fs.readFileSync(path.join(root, "scripts/prepare-worker-assets.mjs"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
const scoring = require(path.join(root, "grade2-scoring.js"));

function validPayload() {
  return {
    schema: scoring.GPT_SCHEMA,
    setKey: "set-01",
    writing: {
      summary: { content: 2, organization: 3, vocabulary: 2, grammar: 3, total: 10 },
      essay: { content: 3, organization: 3, vocabulary: 3, grammar: 2, total: 11 },
      total: 21,
    },
    speaking: {
      taskResponse: 3,
      contentAndInformation: 3,
      pronunciationAndFluency: 2,
      vocabularyAndGrammar: 3,
      total: 11,
    },
  };
}

function executeFlow({ premium }) {
  const appRoot = { addEventListener() {} };
  const context = {
    console,
    document: { getElementById: () => appRoot },
    appState: {
      started: false,
      modal: null,
      module: "reading",
      speakingStep: 0,
      speakingBreakOpen: false,
      speakingRecordings: {},
      speakingRecordMessage: "",
      grade2GptScoreDraft: "",
      grade2GptScoreMessage: "",
      grade2GptScores: validPayload(),
    },
    canViewBonus: premium,
    canViewExplanations: premium,
    selectedAccessPlan: { key: premium ? "three" : "single", label: premium ? "3回プレミアム" : "1回版" },
    selectedSet: { key: "set-01" },
    grade2Scoring: scoring,
    speakingSteps: [],
    getGrade2ScoredSpeakingSteps: () => [],
    formatBytes: () => "1 KB",
    renderGrade2CseRanges: () => "",
    copyTextToClipboard: async () => true,
    getGrade2JsonOutputPrompt: () => "prompt",
    renderCalls: 0,
  };
  context.render = () => { context.renderCalls += 1; };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(flowSource, context);
  return context;
}

function executeDeveloperShortcut({ dev }) {
  let appended = null;
  let clickHandler = null;
  let movedTo = null;
  let createCount = 0;
  const button = {
    type: "",
    className: "",
    dataset: {},
    textContent: "",
    setAttribute() {},
    addEventListener(type, handler) {
      if (type === "click") clickHandler = handler;
    },
  };
  const context = {
    URLSearchParams,
    window: {
      APP_CONFIG: { mode: "grade2-product", grade: "grade2" },
      location: { search: dev ? "?dev=1" : "" },
      moveToDeveloperLocation(value) { movedTo = value; },
    },
    document: {
      querySelector: () => null,
      createElement: () => {
        createCount += 1;
        return button;
      },
      body: { appendChild(node) { appended = node; } },
    },
  };
  vm.createContext(context);
  vm.runInContext(developerShortcutSource, context);
  return {
    appended,
    button,
    createCount,
    click() { clickHandler?.(); },
    movedTo: () => movedTo,
  };
}

test("1. premium page keeps AI grading in the exam and exposes the four purchaser benefits", () => {
  const visible = bonusHtml.match(/<div data-bonus-content hidden>[\s\S]*?<\/div>\s*\n\s*<section class="locked-card"/u)?.[0] || "";
  assert.equal((visible.match(/<section class="bonus-section/g) || []).length, 2);
  assert.match(visible, /id="pdf"/);
  assert.match(visible, /id="seven-days"/);
  assert.match(visible, /id="fourteen-days"/);
  assert.match(visible, /id="weakness-route"/);
  assert.doesNotMatch(visible, /id="ai-grading"/);
  assert.match(visible, /eiken-grade2-final-check-writing-template\.pdf/);
  assert.match(visible, /AI採点は「購入者特典」ではなく、3回プレミアム本体/);
});

test("2. premium bonus script remains only access and exam-link normalization", () => {
  assert.match(bonusScript, /requestedPlan === "three" \|\| requestedPlan === "five"/);
  assert.match(bonusScript, /purchaseHint === "three"/);
  assert.match(bonusScript, /link\.setAttribute\("href", "\.\/exam\.html\?plan=three"\)/);
  assert.ok(bonusScript.length < 2000);
  assert.doesNotMatch(bonusCss, /\.template-tabs|\.prompt-switch|\.plan-switch|\.practice-lab|\.speaking-grid/);
});

test("3. exam uses the current grading assets and the dedicated developer shortcut after app.js", () => {
  assert.match(examHtml, /grade2-ai-grading-flow\.css\?v=grade2-ai-grading-flow-v81/);
  assert.match(examHtml, /grade2-ai-grading-flow\.js\?v=grade2-ai-grading-flow-v82-purchaser-separation/);
  assert.match(examHtml, /grade2-developer-score-shortcut\.css\?v=grade2-dev-score-shortcut-v1/);
  assert.match(examHtml, /grade2-developer-score-shortcut\.js\?v=grade2-dev-score-shortcut-v1/);
  assert.ok(examHtml.indexOf("app.js?") < examHtml.indexOf("grade2-developer-score-shortcut.js?"));
  assert.doesNotMatch(examHtml, /grade2-ai-grading-flow-v80/);
});

test("4. grading flow no longer uses MutationObserver or DOM rewrite loops", () => {
  assert.doesNotMatch(flowSource, /MutationObserver/);
  assert.doesNotMatch(flowSource, /querySelectorAll\(|\.remove\(\)|patchQueued|schedulePatch|queueMicrotask\(patch/);
  for (const name of ["renderGrade2GptPanel", "renderGrade2ScoreResult", "renderGrade2SpeakingReviewV2", "getValidatedGrade2GptScores"]) {
    assert.match(flowSource, new RegExp(`window\\.${name} = function`));
  }
});

test("5. non-premium plans cannot reuse persisted premium AI scores", () => {
  const context = executeFlow({ premium: false });
  assert.equal(context.getValidatedGrade2GptScores(), null);
  const panel = context.renderGrade2GptPanel(validPayload());
  assert.match(panel, /3回プレミアムで利用できます/);
  assert.doesNotMatch(panel, /data-action="copy-grade2-grading-data"|data-grade2-ai-provider|data-action="import-grade2-gpt-score"/);
  assert.equal(context.renderCalls, 1);
});

test("6. premium flow renders without observer and keeps the three trusted steps", () => {
  const context = executeFlow({ premium: true });
  const panel = context.renderGrade2GptPanel(null);
  for (const text of ["スピーキング音声を保存", "AIで採点", "AIの回答を戻す", "採点用5音声を保存", "採点データをコピー", "採点結果を反映する"]) {
    assert.match(panel, new RegExp(text));
  }
  assert.equal(context.renderCalls, 1);
});

test("7. speaking completion is rendered directly without mid-exam AI actions", () => {
  assert.match(flowSource, /window\.renderGrade2SpeakingReviewV2 = function/);
  const reviewBlock = flowSource.match(/window\.renderGrade2SpeakingReviewV2 = function[\s\S]*?\n  \};/u)?.[0] || "";
  assert.match(reviewBlock, /そのままリスニングへ進む（本番形式）/);
  assert.match(reviewBlock, /AI採点は4技能をすべて終えた後の結果画面から行えます/);
  assert.doesNotMatch(reviewBlock, /grade2-speaking-copy-grading-prompt|grade2-speaking-download-all/);
});

test("8. audio step has both batch and individual save fallbacks", () => {
  assert.match(flowSource, /data-action="grade2-speaking-download-all"/);
  assert.match(flowSource, /data-action="speaking-record-download"/);
  assert.match(flowSource, /一括保存できない場合/);
  assert.match(flowCss, /\.grade2-ai-individual-downloads/);
  assert.match(flowCss, /\.grade2-ai-individual-row/);
});

test("9. provider links are direct official roots and never carry user data", () => {
  for (const url of ["https://chatgpt.com/", "https://gemini.google.com/", "https://claude.ai/", "https://www.perplexity.ai/"]) {
    assert.match(flowSource, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(flowSource, /target="_blank"/);
  assert.match(flowSource, /rel="noopener noreferrer"/);
  assert.match(flowSource, /referrerpolicy="no-referrer"/);
  assert.doesNotMatch(flowSource, /\?prompt=|\?answer=|FormData|fetch\(.*provider/);
});

test("10. normal user-facing flow hides JSON/schema terminology", () => {
  assert.doesNotMatch(flowSource, />採点JSON</);
  assert.doesNotMatch(flowSource, />AIの採点結果JSON</);
  assert.doesNotMatch(flowSource, /data-action="copy-grade2-json-output-prompt"/);
  assert.match(flowSource, /data-grade2-ai-recovery/);
  assert.match(flowSource, /AIに形式を整えてもらう指示をコピー/);
});

test("11. existing parser accepts a full AI response and extracts the embedded score payload", () => {
  const payload = validPayload();
  const response = `総評です。\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  const parsed = scoring.parseAndValidateGptScore(response, "set-01");
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, payload);
});

test("12. scoring validation still rejects wrong set, decimals, and inconsistent totals", () => {
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-01").ok, true);
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-02").ok, false);

  const decimal = validPayload();
  decimal.writing.summary.content = 2.5;
  assert.equal(scoring.validateGptScorePayload(decimal, "set-01").ok, false);

  const badTotal = validPayload();
  badTotal.speaking.total = 20;
  assert.equal(scoring.validateGptScorePayload(badTotal, "set-01").ok, false);
});

test("13. mobile layout remains usable for providers and individual downloads", () => {
  assert.match(flowCss, /@media \(max-width: 760px\)/);
  assert.match(flowCss, /grade2-ai-provider-grid \{ grid-template-columns: repeat\(2/);
  assert.match(flowCss, /@media \(max-width: 390px\)/);
  assert.match(flowCss, /grade2-ai-provider-grid \{ grid-template-columns: 1fr/);
  assert.match(flowCss, /@media \(max-width: 520px\)/);
});

test("14. existing app actions required by the direct renderer are still present", () => {
  for (const action of ["grade2-speaking-download-all", "speaking-record-download", "copy-grade2-grading-data", "import-grade2-gpt-score"]) {
    assert.match(appSource, new RegExp(action));
  }
  assert.match(appSource, /function getGrade2GradingPackageText\(\)/);
  assert.match(appSource, /function importGrade2GptScore\(\)/);
});

test("15. developer mode always gets a fixed score-screen shortcut and normal mode does not", () => {
  assert.match(developerShortcutSource, /params\.get\("dev"\) === "1"/);
  assert.match(developerShortcutSource, /window\.moveToDeveloperLocation\("result"\)/);
  assert.doesNotMatch(developerShortcutSource, /MutationObserver/);
  assert.match(developerShortcutCss, /position:\s*fixed/);
  assert.match(developerShortcutCss, /z-index:\s*12000/);
  assert.match(developerShortcutCss, /safe-area-inset-top/);

  const developer = executeDeveloperShortcut({ dev: true });
  assert.equal(developer.createCount, 1);
  assert.equal(developer.appended, developer.button);
  assert.equal(developer.button.textContent, "採点画面を見る");
  developer.click();
  assert.equal(developer.movedTo(), "result");

  const normal = executeDeveloperShortcut({ dev: false });
  assert.equal(normal.createCount, 0);
  assert.equal(normal.appended, null);
});

test("16. worker build ships both grading UI and developer shortcut assets", () => {
  for (const file of [
    "grade2-ai-grading-flow.js",
    "grade2-ai-grading-flow.css",
    "grade2-developer-score-shortcut.js",
    "grade2-developer-score-shortcut.css",
  ]) {
    assert.match(prepareWorkerAssetsSource, new RegExp(`"${file.replaceAll(".", "\\.")}"`));
  }
});
