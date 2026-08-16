const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const bonusHtml = fs.readFileSync(path.join(root, "bonus.html"), "utf8");
const bonusCss = fs.readFileSync(path.join(root, "bonus.css"), "utf8");
const bonusScript = fs.readFileSync(path.join(root, "grade2-premium-bonus.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const examHtml = fs.readFileSync(path.join(root, "exam.html"), "utf8");
const swSource = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const swSet02Source = fs.readFileSync(path.join(root, "sw-set02-v2.js"), "utf8");
const scoring = require(path.join(root, "grade2-scoring.js"));

function providerEntries() {
  const providerBlock = bonusScript.match(/const externalAiProviders = Object\.freeze\(\[[\s\S]*?\n  \]\);/u)?.[0] || "";
  return [...providerBlock.matchAll(/Object\.freeze\(\{\s*id:\s*"([^"]+)"[\s\S]*?label:\s*"([^"]+)"[\s\S]*?href:\s*"([^"]+)"[\s\S]*?description:\s*"([^"]+)"/gu)].map((match) => ({
    id: match[1],
    label: match[2],
    href: match[3],
    description: match[4],
  }));
}

function validPayload(overrides = {}) {
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
    ...overrides,
  };
}

test("1. premium page has the AI grading section, four steps, and required warnings", () => {
  assert.match(bonusHtml, /id="ai-grading"/);
  assert.match(bonusHtml, /href="#ai-grading">AI採点<\/a>/);
  for (const text of ["採点データをコピー", "5音声を保存", "普段使うAIで採点", "JSONをCBTへ戻す"]) assert.match(bonusHtml, new RegExp(text));
  for (const text of [
    "答案や録音は、このCBTアプリから外部AIへ自動送信されません。",
    "実名、学校名、その他の個人情報は入力しないでください。",
    "採点は学習用の参考評価であり、英検の公式採点・公式CSE・公式合否ではありません。",
  ]) assert.match(bonusHtml, new RegExp(text));
});

test("2. chooser dialog exposes the required actions and accessible names", () => {
  assert.match(bonusHtml, /data-action="open-ai-provider-dialog"/);
  assert.match(bonusHtml, /<dialog[^>]+aria-labelledby="ai-grading-dialog-title"[^>]+aria-describedby="ai-grading-dialog-description"/);
  assert.match(bonusHtml, /id="ai-grading-dialog-title">普段使っているAIを選ぶ/);
  assert.match(bonusHtml, /id="ai-grading-dialog-description">[^<]*コピーした採点データを貼り付け/);
  assert.match(bonusHtml, /data-action="close-ai-grading"/);
  assert.match(bonusScript, /addEventListener\("cancel"/);
  assert.match(bonusScript, /event\.target === event\.currentTarget/);
  assert.match(bonusScript, /event\.key === "Escape"/);
  assert.match(bonusScript, /aiGradingTrigger/);
  assert.match(bonusScript, /ai-grading-dialog-open/);
  assert.doesNotMatch(bonusScript, /is-fallback-open/);
  const outsideClickGuard = bonusScript.indexOf("aiGradingDialogOpen &&");
  const providerDialogAction = bonusScript.indexOf('if (action === "open-ai-provider-dialog"');
  assert.ok(outsideClickGuard >= 0 && outsideClickGuard < providerDialogAction, "outside-click guard must run before the open action");
  assert.match(bonusScript, /!event\.target\.closest\("\[data-action='open-ai-provider-dialog'\], \[data-action='open-ai-grading'\]"\)/);
  assert.doesNotMatch(bonusScript, /document\.addEventListener\("click", \(event\) => \{\s*if \(aiGradingDialogOpen/);
  assert.match(bonusScript, /function trapAiGradingDialogFocus\(event\)/);
  assert.match(bonusScript, /event\.key !== "Tab"/);
  assert.match(bonusScript, /if \(!dialog\?\.open\) return;/);
  assert.match(bonusScript, /trapAiGradingDialogFocus\(event\)/);
  const trapFunction = bonusScript.match(/function trapAiGradingDialogFocus\(event\) \{[\s\S]*?\n  \}\n\n  function countWords/u)?.[0] || "";
  assert.ok(trapFunction, "native and fallback focus trap function must be present");
  assert.doesNotMatch(trapFunction, /ai-grading-dialog-fallback-open/);
  assert.match(bonusScript, /event\.shiftKey/);
  assert.match(bonusScript, /last\.focus\(\)/);
  assert.match(bonusScript, /first\.focus\(\)/);
});

test("3. exactly four frozen providers have the required shape and unique ids", () => {
  assert.match(bonusScript, /const externalAiProviders = Object\.freeze\(\[/);
  const providers = providerEntries();
  assert.equal(providers.length, 4);
  assert.deepEqual(providers.map((provider) => provider.id), ["chatgpt", "gemini", "claude", "perplexity"]);
  assert.equal(new Set(providers.map((provider) => provider.label)).size, 4);
  assert.ok(providers.every((provider) => provider.description));
  assert.equal((bonusScript.match(/Object\.freeze\(\{\s*id:/gu) || []).length, 4);
});

test("4. provider URLs are HTTPS roots inside the official host allowlist", () => {
  const providers = providerEntries();
  const allowlist = {
    chatgpt: ["chatgpt.com"],
    gemini: ["gemini.google.com"],
    claude: ["claude.ai"],
    perplexity: ["perplexity.ai", "www.perplexity.ai"],
  };
  for (const provider of providers) {
    const url = new URL(provider.href);
    assert.equal(url.protocol, "https:");
    assert.ok(allowlist[provider.id].includes(url.hostname));
    assert.equal(url.pathname, "/");
    assert.equal(url.search, "");
    assert.equal(url.hash, "");
  }
  assert.match(bonusScript, /OFFICIAL_AI_PROVIDER_HOSTS/);
  assert.match(bonusScript, /url\.protocol === "https:"/);
  assert.match(bonusScript, /!url\.search/);
  assert.match(bonusScript, /!url\.hash/);
});

test("5. provider navigation cannot carry answer, prompt, audio, setKey, query, hash, or data URLs", () => {
  const providers = providerEntries();
  for (const provider of providers) {
    assert.doesNotMatch(provider.href, /\?|#|data:/iu);
    assert.doesNotMatch(provider.href, /answer|prompt|audio|setKey/iu);
  }
  const openExternalAi = bonusScript.match(/function openExternalAi\([\s\S]*?\n  \}/u)?.[0] || "";
  assert.doesNotMatch(openExternalAi, /clipboard|FormData|fetch\(/u);
  assert.doesNotMatch(openExternalAi, /window\.open/);
  assert.match(openExternalAi, /window\.location\.assign\(selectedProvider\.href\)/);
});

test("6. result-to-bonus links use a new tab and preserve the result tab", () => {
  assert.match(appSource, /href="\$\{GRADE2_EXTERNAL_AI_GRADING_URL\}" target="_blank" rel="noopener noreferrer"/);
  assert.match(appSource, /GRADE2_EXTERNAL_AI_GRADING_URL = "\.\/bonus\.html\?plan=three#ai-grading"/);
  const panelStart = appSource.indexOf("function renderGrade2GptPanel");
  const panelEnd = appSource.indexOf("\nfunction renderReviewBoard", panelStart);
  const panelSource = appSource.slice(panelStart, panelEnd);
  assert.match(panelSource, /const dedicatedAiAction = GRADE2_GRADING_GPT_URL/);
  assert.match(panelSource, /\$\{dedicatedAiAction\}/);
  assert.ok(panelSource.indexOf("const dedicatedAiAction") < panelSource.indexOf("const premiumActions"), "dedicated link must be outside the premium action gate");
  assert.match(panelSource, /canViewBonus \? "専用採点AIは未設定です。下の外部AI選択をご利用ください。" : "専用採点AIは現在設定されていません。"/);
  assert.match(appSource, /target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">専用採点AIを開く/);
});

test("7. general-AI grading prompt is self-contained and rejects official-score claims", () => {
  assert.doesNotMatch(appSource, /完成Instructionsに従って/);
  for (const text of [
    "英検2級S-CBT対策",
    "英検の公式採点・公式CSE・公式合否ではありません",
    "CSE点や合否をAI自身が生成してはいけません",
    "模範解答は完全一致を求める正解ではなく、比較用",
    "必要な答案・音声が不足している場合",
    "発音・流暢さを文字起こしだけから推測しないでください",
  ]) assert.match(appSource, new RegExp(text));
  assert.match(appSource, /Writingは要約と英作文を別々に採点/);
  assert.match(appSource, /Speakingは、taskResponse/);
});

test("8. speaking package preserves source indexes, filenames, and No.2 story data", () => {
  assert.match(appSource, /function getGrade2ScoredSpeakingSteps\(\)/);
  assert.match(appSource, /getGrade2ScoredSpeakingSteps\(\)\.map\(\(\{ step, index: stepIndex \}, order\) =>/);
  assert.match(appSource, /expectedRecordingFileName: buildSpeakingRecordingFileName\(stepIndex/);
  assert.match(appSource, /recordingPresent: Boolean\(recording\)/);
  for (const field of ["order", "stepIndex", "id", "label", "prompt", "passage", "pictureStory", "modelAnswerForComparison"]) assert.match(appSource, new RegExp(`${field}[,:]`));
  for (const field of ["imageAlt", "openingSentence", "firstSpeech", "firstTimeLabel", "secondTimeLabel"]) assert.match(appSource, new RegExp(field));
  for (const text of [
    "アップロードされた各音声をexpectedRecordingFileNameと照合してください",
    "対応を判断できない音声を別問題の回答として採点しないでください",
    "不足・重複・不明なファイルがある場合は、その事実を先に示してください",
  ]) assert.match(appSource, new RegExp(text));
});

test("9. JSON-only re-output prompt has the fixed schema, ranges, template, and action", () => {
  assert.match(appSource, /function getGrade2JsonOutputPrompt\(\)/);
  assert.match(appSource, /data-action="copy-grade2-json-output-prompt"/);
  assert.match(appSource, /GRADE2_JSON_OUTPUT_PROMPT_TEMPLATE/);
  assert.match(appSource, /split\("\{\{SET_KEY\}\}"\)\.join\(selectedSet\.key\)/);
  for (const text of [
    "scbt-grade2-gpt-score-v1",
    "Writing各課題のtotalは4観点の算術合計で、0〜16",
    "writing.totalは要約と英作文の合計で、0〜32",
    "speaking.totalは4観点の算術合計で、0〜20",
    "小数、文字列、分数、単位、コメントを入れないでください",
    "下の0は形式見本",
    "点数を推測せず、不足を説明してJSONを出さない",
    "JSONコードブロックを1つだけ",
  ]) assert.match(appSource, new RegExp(text));
});

test("10. prompt schema remains identical to the scoring schema", () => {
  assert.equal(scoring.GPT_SCHEMA, "scbt-grade2-gpt-score-v1");
  assert.match(appSource, /schema: "scbt-grade2-gpt-score-v1"/);
  assert.match(appSource, /"schema": "scbt-grade2-gpt-score-v1"/);
});

test("11. existing JSON validation still accepts valid values and rejects mismatch, decimals, and bad totals", () => {
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-01").ok, true);
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-02").ok, false);
  const invalid = validPayload();
  invalid.writing.summary.content = 4.5;
  invalid.writing.essay.total = 10;
  assert.equal(scoring.validateGptScorePayload(invalid, "set-01").ok, false);
});

test("12. speaking and normal-flow contracts plus matching v71 caches remain present", () => {
  for (const id of ["read-aloud", "no-1", "no-2", "no-3", "no-4"]) assert.match(appSource, new RegExp(`"${id}"`));
  assert.match(appSource, /スピーキング単体のAI振り返り用プロンプトをコピー/);
  assert.match(appSource, /最終的なWriting・Speaking採点JSONは、4技能終了後の結果画面から作成します/);
  assert.match(appSource, /そのままリスニングへ進む（本番形式）/);
  const swCache = swSource.match(/const CACHE_NAME = "([^"]+)"/u)?.[1];
  const swSet02Cache = swSet02Source.match(/const CACHE_NAME = "([^"]+)"/u)?.[1];
  assert.equal(swCache, "cbt-grade2-app-shell-v71-ai-grading");
  assert.equal(swSet02Cache, swCache);
  assert.match(examHtml, /app\.js\?v=grade2-reading-writing-listening-v71-ai-grading/);
  assert.match(examHtml, /sw-set02-v2\.js\?v=grade2-reading-writing-listening-v71-ai-grading/);
  assert.match(bonusHtml, /bonus\.css\?v=grade2-premium-v71-ai-grading/);
  assert.match(bonusHtml, /grade2-premium-bonus\.js\?v=grade2-three-premium-v71-ai-grading/);
  assert.match(bonusCss, /prefers-reduced-motion/);
  assert.match(bonusCss, /safe-area-inset-bottom/);
});
