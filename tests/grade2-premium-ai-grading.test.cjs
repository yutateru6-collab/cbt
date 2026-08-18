const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const bonusHtml = fs.readFileSync(path.join(root, "bonus.html"), "utf8");
const bonusCss = fs.readFileSync(path.join(root, "bonus.css"), "utf8");
const bonusScript = fs.readFileSync(path.join(root, "grade2-premium-bonus.js"), "utf8");
const flowSource = fs.readFileSync(path.join(root, "grade2-ai-grading-flow.js"), "utf8");
const flowCss = fs.readFileSync(path.join(root, "grade2-ai-grading-flow.css"), "utf8");
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

test("1. premium page exposes exactly the PDF and AI grading benefits", () => {
  const visible = bonusHtml.match(/<div data-bonus-content hidden>[\s\S]*?<\/div>\s*\n\s*<section class="locked-card"/u)?.[0] || "";
  assert.equal((visible.match(/<section class="bonus-section/g) || []).length, 2);
  assert.match(visible, /id="pdf"/);
  assert.match(visible, /id="ai-grading"/);
  assert.match(visible, /eiken-grade2-final-check-writing-template\.pdf/);
  assert.match(visible, /特典は、<br \/>この二つだけ。/);
  assert.doesNotMatch(visible, /AI振り返り|7日・14日|弱点別|スピーキング即答型|ライティング回答型/);
});

test("2. premium bonus script is only access and legacy-plan normalization", () => {
  assert.match(bonusScript, /requestedPlan === "three" \|\| requestedPlan === "five"/);
  assert.match(bonusScript, /normalized\.searchParams\.set\("plan", "three"\)/);
  assert.doesNotMatch(bonusScript, /externalAiProviders|vocabularyNotes|prompt-switch|weakness|ChatGPT|Gemini|Claude|Perplexity/);
  assert.ok(bonusScript.length < 2000, "legacy premium bonus code should be removed rather than left dormant");
  assert.doesNotMatch(bonusCss, /\.template-tabs|\.prompt-switch|\.plan-switch|\.practice-lab|\.speaking-grid/);
});

test("3. exam loads the isolated AI grading UI after app.js", () => {
  assert.match(examHtml, /grade2-ai-grading-flow\.css\?v=grade2-ai-grading-flow-v80/);
  assert.match(examHtml, /grade2-ai-grading-flow\.js\?v=grade2-ai-grading-flow-v80/);
  assert.ok(examHtml.indexOf("app.js?") < examHtml.indexOf("grade2-ai-grading-flow.js?"));
});

test("4. result flow is three steps and reuses the existing trusted actions", () => {
  for (const text of [
    "スピーキング音声を保存",
    "AIで採点",
    "AIの回答を戻す",
    "採点用5音声を保存",
    "採点データをコピー",
    "AIの回答をここに貼り付け",
    "採点結果を反映する",
  ]) assert.match(flowSource, new RegExp(text));
  for (const action of [
    "grade2-speaking-download-all",
    "copy-grade2-grading-data",
    "import-grade2-gpt-score",
    "copy-grade2-json-output-prompt",
  ]) assert.match(flowSource, new RegExp(`data-action=\\"${action}\\"`));
  assert.match(appSource, /async function downloadAllGrade2SpeakingRecordings\(\)/);
  assert.match(appSource, /function getGrade2GradingPackageText\(\)/);
  assert.match(appSource, /function importGrade2GptScore\(\)/);
});

test("5. speaking completion no longer exposes mid-exam AI grading actions", () => {
  assert.match(flowSource, /grade2-speaking-copy-grading-prompt/);
  assert.match(flowSource, /grade2-speaking-download-all/);
  assert.match(flowSource, /AI採点は4技能をすべて終えた後の結果画面から行えます/);
  const cleanup = flowSource.match(/function cleanSpeakingCompletion\(\)[\s\S]*?\n  \}/u)?.[0] || "";
  assert.match(cleanup, /\.remove\(\)/);
  assert.match(cleanup, /speaking-review-list\.compact-list/);
});

test("6. provider links are direct, official, new-tab roots with no user data", () => {
  const expected = [
    "https://chatgpt.com/",
    "https://gemini.google.com/",
    "https://claude.ai/",
    "https://www.perplexity.ai/",
  ];
  for (const url of expected) assert.match(flowSource, new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(flowSource, /target="_blank"/);
  assert.match(flowSource, /rel="noopener noreferrer"/);
  assert.match(flowSource, /referrerpolicy="no-referrer"/);
  assert.doesNotMatch(flowSource, /\?prompt=|\?answer=|FormData|fetch\(.*provider|clipboard.*provider/);
});

test("7. normal users see no JSON jargon in the primary flow", () => {
  assert.doesNotMatch(flowSource, />採点JSON</);
  assert.doesNotMatch(flowSource, />AIの採点結果JSON</);
  assert.match(flowSource, /うまく採点結果を読み取れない場合/);
  assert.match(flowSource, /AIに形式を整えてもらう指示をコピー/);
});

test("8. existing parser accepts a full AI response and extracts the embedded score payload", () => {
  const payload = validPayload();
  const response = `総評です。\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  const parsed = scoring.parseAndValidateGptScore(response, "set-01");
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.value, payload);
});

test("9. scoring validation still rejects wrong set, decimals, and inconsistent totals", () => {
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-01").ok, true);
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-02").ok, false);

  const decimal = validPayload();
  decimal.writing.summary.content = 2.5;
  assert.equal(scoring.validateGptScorePayload(decimal, "set-01").ok, false);

  const badTotal = validPayload();
  badTotal.speaking.total = 20;
  assert.equal(scoring.validateGptScorePayload(badTotal, "set-01").ok, false);
});

test("10. mobile layout remains one-column where the workflow needs it", () => {
  assert.match(flowCss, /@media \(max-width: 760px\)/);
  assert.match(flowCss, /grade2-ai-provider-grid \{ grid-template-columns: repeat\(2/);
  assert.match(flowCss, /@media \(max-width: 390px\)/);
  assert.match(flowCss, /grade2-ai-provider-grid \{ grid-template-columns: 1fr/);
  assert.match(bonusCss, /@media \(max-width: 720px\)/);
  assert.match(bonusCss, /ai-flow-preview \{ grid-template-columns: 1fr/);
});
