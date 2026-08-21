const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const rootDir = path.resolve(__dirname, "..");
const source = fs.readFileSync(path.join(rootDir, "grade2-result-tabs.js"), "utf8");
const css = fs.readFileSync(path.join(rootDir, "grade2-result-tabs.css"), "utf8");
const examHtml = fs.readFileSync(path.join(rootDir, "exam.html"), "utf8");
const prepare = fs.readFileSync(path.join(rootDir, "scripts", "prepare-worker-assets.mjs"), "utf8");
const serviceWorker = fs.readFileSync(path.join(rootDir, "sw-set02-v2.js"), "utf8");

function scorePayload({ feedback = false } = {}) {
  const payload = {
    schema: "scbt-grade2-gpt-score-v1",
    setKey: "set-01",
    writing: {
      summary: { content: 3, organization: 3, vocabulary: 3, grammar: 2, total: 11 },
      essay: { content: 4, organization: 3, vocabulary: 3, grammar: 3, total: 13 },
      total: 24,
    },
    speaking: {
      taskResponse: 4,
      contentAndInformation: 3,
      pronunciationAndFluency: 3,
      vocabularyAndGrammar: 4,
      total: 14,
    },
  };
  if (feedback) {
    payload.feedbackSchema = "scbt-grade2-feedback-v1";
    payload.feedback = {
      overallComment: "内容は伝わっています。次は理由を具体化しましょう。",
      writing: {
        summary: {
          scoreReasons: { content: "要点を含む", organization: "流れが自然", vocabulary: "適切", grammar: "一部誤り" },
          goodPoints: ["主題を捉えている", "利点と欠点がある"],
          priorityAdvice: "冠詞を確認する",
          corrections: [{ before: "a information", after: "information", reason: "不可算名詞" }],
          improvedAnswer: "An improved summary.",
        },
        essay: {},
      },
      speaking: {
        scoreReasons: { taskResponse: "質問に答えた", contentAndInformation: "理由がある", pronunciationAndFluency: "概ね明瞭", vocabularyAndGrammar: "適切" },
        items: [{ id: "no-1", audioStatus: "clear", heardText: "It can reduce waste.", goodPoint: "直接答えた", priorityAdvice: "もう一文加える", practiceExample: "It can reduce waste because people reuse bottles." }],
        overallAdvice: "理由と具体例を一組で話す",
      },
    };
  }
  return payload;
}

function createContext({ scores = null } = {}) {
  let clickHandler = null;
  let renderCount = 0;
  const appRoot = {
    addEventListener(type, handler) {
      if (type === "click") clickHandler = handler;
    },
    querySelector() { return null; },
  };
  const readingQuestions = [
    { id: 1, text: "Correct question", choices: ["A", "B", "C", "D"], correct: 1, explanation: "【学習ポイント】正解の確認" },
    { id: 2, text: "Wrong question", choices: ["A", "B", "C", "D"], correct: 2, explanation: "【学習ポイント】文脈を確認する" },
    { id: 3, text: "Unanswered question", choices: ["A", "B", "C", "D"], correct: 3, explanation: "【学習ポイント】設問を確認する" },
  ];
  const listeningQuestions = [
    { id: 1, questionText: "Listening wrong", choices: ["A", "B", "C"], correct: 2, script: "A short script.", explanation: "【学習ポイント】理由を聞く" },
    { id: 2, questionText: "Listening correct", choices: ["A", "B", "C"], correct: 1, script: "Another script.", explanation: "【学習ポイント】人物を聞く" },
  ];
  const writingTasks = [
    { id: 32, kind: "summary", label: "要約", targetWords: "45〜55語", lead: "Summarize.", source: ["Source"], modelAnswer: "Model summary." },
    { id: 33, kind: "essay", label: "英作文", targetWords: "80〜100語", lead: "Write your opinion.", source: ["Question"], modelAnswer: "Model essay." },
  ];
  const speakingSteps = [
    { id: "read-aloud", label: "Read Aloud", promptSpeech: "Read.", cardText: "Passage", modelAnswer: "" },
    { id: "no-1", label: "No. 1", questionText: "How?", modelAnswer: "It can reduce waste." },
    { id: "no-2", label: "No. 2", questionText: "Describe.", modelAnswer: "A story." },
    { id: "no-3", label: "No. 3", questionText: "What do you think?", modelAnswer: "I think so." },
    { id: "no-4", label: "No. 4", questionText: "Do you agree?", modelAnswer: "Yes, I do." },
  ];

  const context = {
    console,
    document: { getElementById: () => appRoot },
    APP_CONFIG: { mode: "grade2-product" },
    appState: {
      modal: "complete",
      module: "reading",
      started: true,
      answers: { written: { 1: 1, 2: 1 }, listening: { 1: 1, 2: 1 } },
      writingAnswers: { 32: "This is my summary.", 33: "This is my essay answer." },
      speakingRecordings: { 0: { type: "audio/webm" }, 1: { type: "audio/webm" } },
      listeningReviewMode: false,
      listeningIndex: 0,
      listeningAnswerRemaining: 10,
    },
    canViewBonus: true,
    canViewExplanations: true,
    selectedGradeDisplay: "2級",
    selectedSetLabel: "第1回",
    selectedSet: { key: "set-01" },
    listeningQuestions,
    writingTasks,
    speakingRecordingUrls: { 1: "blob:no-1" },
    LISTENING_ANSWER_SECONDS: 10,
    listeningPlaybackPhase: "idle",
    grade2Scoring: { summarizeScores: () => ({ level: { key: "pass", label: "目安" } }) },
    getExamSummary: () => ({
      reading: { correct: 1, total: 3, unanswered: 1 },
      listening: { correct: 1, total: 2, unanswered: 0 },
    }),
    getValidatedGrade2GptScores: () => scores,
    getReadingQuestions: () => readingQuestions,
    getChoiceText: (question, number) => question.choices[number - 1],
    renderReviewChoices: () => '<ol class="review-choices"><li>choices</li></ol>',
    renderReviewExplanation: () => '<div class="review-explanation">explanation</div>',
    getFallbackStudyPoint: () => "fallback point",
    renderDeveloperToolbar: () => "",
    renderGrade2CseRanges: () => '<section class="cse-estimate-panel">CSE</section>',
    renderGrade2GptPanel: () => '<section class="grade2-ai-flow-card">AI FLOW</section>',
    getGrade2ScoredSpeakingSteps: () => speakingSteps.map((step, index) => ({ step, index })),
    buildSpeakingRecordingFileName: (index) => `speaking-${index}.webm`,
    stopListeningPlayback() {},
    syncGrade2ModuleUrl() {},
    saveState() {},
    setTimeout(callback) { callback(); },
  };
  context.render = () => { renderCount += 1; };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(source, context);
  return {
    context,
    clickHandler: () => clickHandler,
    renderCount: () => renderCount,
    targetFor(selectorMap) {
      return {
        closest(selector) { return selectorMap[selector] || null; },
      };
    },
  };
}

test("result screen defaults to four skill tabs and only review-needed Reading items", () => {
  const run = createContext();
  const html = run.context.renderComplete();
  assert.equal((html.match(/role="tab"/g) || []).length, 4);
  assert.match(html, /採点結果・解説/);
  assert.match(html, /要復習 2問/);
  assert.match(html, /Wrong question/);
  assert.match(html, /Unanswered question/);
  assert.doesNotMatch(html, /Correct question/);
  assert.match(html, /あなたの答え/);
  assert.match(html, /詳しい解説・全選択肢を見る/);
});

test("tab and filter interactions keep one skill visible at a time", () => {
  const run = createContext();
  const handler = run.clickHandler();
  handler({ target: run.targetFor({ "[data-grade2-result-filter]": { dataset: { grade2ResultFilterSkill: "reading", grade2ResultFilter: "all" } } }) });
  let html = run.context.renderComplete();
  assert.match(html, /Correct question/);

  handler({ target: run.targetFor({ "[data-grade2-result-tab]": { dataset: { grade2ResultTab: "writing" } } }) });
  html = run.context.renderComplete();
  assert.match(html, /AI採点待ち/);
  assert.match(html, /自分の答案を見る/);
  assert.doesNotMatch(html, /Wrong question/);
});

test("AI flow is hidden until the user opens it", () => {
  const run = createContext();
  let html = run.context.renderComplete();
  assert.doesNotMatch(html, /AI FLOW/);

  run.clickHandler()({ target: run.targetFor({ "[data-grade2-grading-open]": { dataset: { grade2GradingOpen: "writing" } } }) });
  html = run.context.renderComplete();
  assert.match(html, /AI FLOW/);
  assert.match(html, /AI採点/);
});

test("enriched AI feedback is rendered inside Writing and Speaking tabs", () => {
  const run = createContext({ scores: scorePayload({ feedback: true }) });
  const handler = run.clickHandler();
  handler({ target: run.targetFor({ "[data-grade2-result-tab]": { dataset: { grade2ResultTab: "writing" } } }) });
  let html = run.context.renderComplete();
  assert.match(html, /24\/32/);
  assert.match(html, /主題を捉えている/);
  assert.match(html, /具体的な添削を見る/);

  handler({ target: run.targetFor({ "[data-grade2-result-tab]": { dataset: { grade2ResultTab: "speaking" } } }) });
  html = run.context.renderComplete();
  assert.match(html, /14\/20/);
  assert.match(html, /AIにはこう聞こえました/);
  assert.match(html, /It can reduce waste/);
});

test("Listening review button opens the selected question directly", () => {
  const run = createContext();
  run.clickHandler()({ target: run.targetFor({ "[data-grade2-listening-review]": { dataset: { grade2ListeningReview: "1" } } }) });
  assert.equal(run.context.appState.module, "listening");
  assert.equal(run.context.appState.modal, null);
  assert.equal(run.context.appState.listeningReviewMode, true);
  assert.equal(run.context.appState.listeningIndex, 1);
  assert.equal(run.context.listeningPlaybackPhase, "review");
});

test("copied grading prompt requests structured feedback while preserving the score schema", () => {
  const run = createContext();
  const prompt = run.context.getGrade2GradingPackageText();
  assert.match(prompt, /scbt-grade2-gpt-score-v1/);
  assert.match(prompt, /scbt-grade2-feedback-v1/);
  assert.match(prompt, /AIにはこう聞こえ/);
  assert.match(prompt, /Read Aloud/);
  assert.match(prompt, /説明文やMarkdownを付けず/);
});

test("mobile CSS and deployment wiring include the result-tab assets", () => {
  assert.match(css, /\.grade2-result-skill-tabs/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(examHtml, /grade2-result-tabs\.css\?v=grade2-result-tabs-v1/);
  assert.match(examHtml, /grade2-result-tabs\.js\?v=grade2-result-tabs-v1/);
  assert.ok(examHtml.indexOf("grade2-ai-grading-flow.js?") < examHtml.indexOf("grade2-result-tabs.js?"));
  assert.match(prepare, /"grade2-result-tabs\.js"/);
  assert.match(prepare, /"grade2-result-tabs\.css"/);
  assert.match(serviceWorker, /cbt-grade2-app-shell-v83-result-tabs/);
  assert.match(serviceWorker, /"\/grade2-result-tabs\.js"/);
  assert.match(serviceWorker, /"\/grade2-result-tabs\.css"/);
});
