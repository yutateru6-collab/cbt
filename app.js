const IMPORT_STORAGE_KEY = "scbt-external-exam-overrides";
const examCatalog = window.examData || {};
const importedGradeOverrides = loadImportedGradeOverrides();
const baseGradeCatalog = examCatalog.grades || { pre2: examCatalog };
const gradeCatalog = applyImportedGradeOverrides(baseGradeCatalog, importedGradeOverrides);
const GRADE_SELECTION_KEY = "scbt-selected-grade";
const SET_SELECTION_KEY_PREFIX = "scbt-selected-set";
const requestParams = new URLSearchParams(window.location.search);
const requestedLockedGrade = window.APP_GRADE || examCatalog.appGrade || "";
const availableGradeKeys = (examCatalog.gradeOrder || Object.keys(gradeCatalog)).filter((key) => gradeCatalog[key]);
const fallbackGradeKey = availableGradeKeys[0] || "pre2";
const isGradeLocked = Boolean(requestedLockedGrade && gradeCatalog[requestedLockedGrade]);
const selectedGrade = resolveSelectedGrade();
const selectedSetKey = resolveSelectedSet(selectedGrade);
const selectedGradeData = gradeCatalog[selectedGrade] || gradeCatalog[fallbackGradeKey] || {};
const selectedSet = resolveExamSet(selectedGradeData, selectedSetKey, selectedGrade);
const examData = mergeGradeAndSetData(selectedGradeData, selectedSet);
const selectedGradeLabel = examData.label || selectedGrade;
const selectedGradeDisplay = examData.displayName || selectedGradeLabel;
const selectedSetLabel = examData.setLabel || selectedSet.label || selectedSetKey;
const selectedSetImported = isImportedSet(selectedGrade, selectedSet.key);
const selectedGradeImported = selectedSetImported;

document.title = `${selectedGradeLabel}CBT形式4技能トレーニング`;

const GRADE_REQUIREMENTS = {
  pre2: {
    readingPageCounts: [15, 5, 2, 7],
    readingLabels: ["語い・熟語", "会話文", "長文語句", "長文内容"],
    listeningCount: 30,
    writingCount: 2,
  },
  grade2: {
    readingPageCounts: [17, 3, 3, 3, 5],
    readingLabels: ["短文空所補充", "長文語句 2A", "長文語句 2B", "メール 3A", "長文内容 3B"],
    listeningCount: 30,
    writingCount: 2,
  },
  pre1: {
    readingPageCounts: [18, 3, 3, 3, 4],
    readingLabels: ["短文空所補充", "長文語句 2A", "長文語句 2B", "長文内容 3A", "長文内容 3B"],
    listeningCount: 29,
    writingCount: 2,
  },
};

function loadImportedGradeOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem(IMPORT_STORAGE_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function applyImportedGradeOverrides(baseCatalog, overrides) {
  return Object.fromEntries(
    Object.entries(baseCatalog).map(([key, grade]) => {
      const override = overrides[key];
      if (!override || typeof override !== "object") return [key, grade];
      const fields = pickImportableExamFields(override);
      const overrideSetKey = normalizeSetKey(override.setKey || override.setId || "set-01");
      const sets = getGradeSets(grade, key);
      const hasTargetSet = sets.some((set) => set.key === overrideSetKey);
      const mergedSets = sets.map((set) =>
        set.key === overrideSetKey
          ? {
              ...set,
              ...fields,
              status: "ready",
              enabled: true,
              importedFromExternalAi: true,
              description: set.description || "取込データ",
            }
          : set,
      );
      if (!hasTargetSet) {
        mergedSets.push({
          key: overrideSetKey,
          setId: `${key}-${overrideSetKey}`,
          label: override.setLabel || `第${Number(overrideSetKey.replace(/\D/g, "")) || mergedSets.length + 1}回`,
          description: "取込データ",
          status: "ready",
          enabled: true,
          importedFromExternalAi: true,
          ...fields,
        });
      }
      return [
        key,
        {
          ...grade,
          ...fields,
          setKey: overrideSetKey,
          sets: mergedSets,
          importedFromExternalAi: true,
        },
      ];
    }),
  );
}

function pickImportableExamFields(source) {
  const fields = {};
  ["readingPages", "listeningQuestions", "writingTasks", "speakingSteps"].forEach((field) => {
    if (Array.isArray(source[field])) fields[field] = source[field];
  });
  return fields;
}

function getSetSelectionKey(gradeKey) {
  return `${SET_SELECTION_KEY_PREFIX}-${gradeKey}`;
}

function getGradeSets(grade, gradeKey) {
  const rawSets = Array.isArray(grade?.sets) && grade.sets.length > 0 ? grade.sets : [makeLegacySet(grade, gradeKey)];
  return rawSets.map((set, index) => normalizeExamSet(set, grade, gradeKey, index));
}

function makeLegacySet(grade, gradeKey) {
  const key = normalizeSetKey(grade?.setKey || grade?.setId || "set-01");
  return {
    key,
    setId: grade?.setId || `${gradeKey}-${key}`,
    label: "第1回",
    status: "ready",
    description: "収録済み",
    ...pickImportableExamFields(grade || {}),
  };
}

function normalizeExamSet(set, grade, gradeKey, index) {
  const key = normalizeSetKey(set?.key || set?.setKey || set?.setId || `set-${String(index + 1).padStart(2, "0")}`);
  const hasExamData = ["readingPages", "listeningQuestions", "writingTasks", "speakingSteps"].some((field) => Array.isArray(set?.[field]));
  const status = set?.status || (hasExamData ? "ready" : "planned");
  return {
    ...(set || {}),
    key,
    setId: set?.setId || `${gradeKey}-${key}`,
    label: set?.label || `第${index + 1}回`,
    description: set?.description || (status === "ready" ? "収録済み" : "準備中"),
    status,
    enabled: set?.enabled !== false && status !== "planned",
    gradeKey: grade?.key || gradeKey,
  };
}

function normalizeSetKey(value) {
  const raw = String(value || "set-01").trim();
  const match = raw.match(/(?:set-?)?(\d{1,2})$/i);
  if (match) return `set-${String(Number(match[1])).padStart(2, "0")}`;
  return raw || "set-01";
}

function resolveSelectedSet(gradeKey) {
  const grade = gradeCatalog[gradeKey] || gradeCatalog[fallbackGradeKey] || {};
  const sets = getGradeSets(grade, gradeKey);
  const enabledSets = sets.filter((set) => set.enabled);
  const fallbackSet = enabledSets[0] || sets[0] || { key: "set-01" };
  const defaultSetKey = normalizeSetKey(grade.defaultSet || fallbackSet.key);
  const requestedSet = requestParams.get("set") || requestParams.get("setKey");
  if (requestedSet) {
    const requestedSetKey = normalizeSetKey(requestedSet);
    if (enabledSets.some((set) => set.key === requestedSetKey)) return requestedSetKey;
  }
  try {
    const savedSet = normalizeSetKey(localStorage.getItem(getSetSelectionKey(gradeKey)));
    if (enabledSets.some((set) => set.key === savedSet)) return savedSet;
  } catch {
    // Local storage can be unavailable in some preview modes.
  }
  if (enabledSets.some((set) => set.key === defaultSetKey)) return defaultSetKey;
  return fallbackSet.key;
}

function resolveExamSet(grade, setKey, gradeKey) {
  const sets = getGradeSets(grade, gradeKey);
  return sets.find((set) => set.key === setKey && set.enabled) || sets.find((set) => set.enabled) || sets[0] || makeLegacySet(grade, gradeKey);
}

function mergeGradeAndSetData(grade, set) {
  const setFields = pickImportableExamFields(set || {});
  return {
    ...(grade || {}),
    ...setFields,
    setKey: set?.key || "set-01",
    setId: set?.setId || grade?.setId || "set-01",
    setLabel: set?.label || "第1回",
    setDescription: set?.description || "",
    setStatus: set?.status || "ready",
  };
}

function isImportedSet(gradeKey, setKey) {
  const imported = importedGradeOverrides[gradeKey];
  if (!imported) return false;
  if (imported.setKey || imported.setId) return normalizeSetKey(imported.setKey || imported.setId) === normalizeSetKey(setKey);
  return normalizeSetKey(setKey) === "set-01";
}

function resolveSelectedGrade() {
  if (isGradeLocked) return requestedLockedGrade;
  const requestedGrade = requestParams.get("grade");
  if (requestedGrade && gradeCatalog[requestedGrade]) return requestedGrade;
  try {
    const savedGrade = localStorage.getItem(GRADE_SELECTION_KEY);
    if (savedGrade && gradeCatalog[savedGrade]) return savedGrade;
  } catch {
    // Local storage can be unavailable in some preview modes.
  }
  return examCatalog.defaultGrade && gradeCatalog[examCatalog.defaultGrade] ? examCatalog.defaultGrade : fallbackGradeKey;
}

const modules = examData.modules || {
  speaking: {
    label: "スピーキング",
    title: "スピーキングテスト",
    start: "スタート",
  },
  listening: {
    label: "リスニング",
    title: "リスニングテスト",
    start: "開始",
  },
  reading: {
    label: "リーディング",
    title: "リーディング / ライティングテスト",
    start: "開始",
  },
  writing: {
    label: "ライティング",
    title: "リーディング / ライティングテスト",
    start: "開始",
  },
};

const readingPages = examData.readingPages || [
  {
    label: "語い・熟語",
    kind: "choice",
    questions: [
      {
        id: 1,
        text: "Josh and Samantha wanted to do their homework together this weekend, but they could not find a time to meet. They decided to work (      ) and check their answers before class on Monday.",
        choices: ["noisily", "exactly", "clearly", "separately"],
      },
      {
        id: 2,
        text: "Last Saturday, Pete and his family drove to the beach. In order to avoid the heavy (      ) on the highway, they left early in the morning.",
        choices: ["traffic", "pride", "rhythm", "temple"],
      },
    ],
  },
  {
    label: "会話文",
    kind: "choice",
    questions: [
      {
        id: 16,
        text: "A: Thank you for calling Edgy Hair Salon. How can I help you? B: Hello, I got a haircut at your salon yesterday, and I think I left my blue scarf there. A: OK, we found one last night. When (      )?",
        choices: ["will you go to work", "do you want a haircut", "did you buy a new one", "can you come to get it"],
      },
      {
        id: 17,
        text: "A: I was thinking about driving to the movie theater tomorrow. B: I want to, but I do not have a car. A: Well, (      ). B: That is perfect.",
        choices: ["I can meet you there at 6:15", "I can pick you up at 6:00", "you could ride a bus at 5:45", "you could take a taxi at 5:30"],
      },
    ],
  },
  {
    label: "長文読解",
    kind: "long",
    passageTitle: "Summer Fun's Music Camp",
    passage: [
      "From: Nicole Hoover <nhoover@summerfun.com>",
      "To: Jeremy Dobbs <j-dobbs77@housemail.com>",
      "Subject: Summer Fun's Music Camp",
      "",
      "Hi Jeremy,",
      "Thanks for your e-mail. You asked about the dates of this year's music camps for teenagers and how to apply. The first camp is for singing, and the second one is for people who play instruments.",
      "The fee for each camp is $1,500 per person. Also, you said your younger brother would like to join you this year. If he is at least 13 years old, he can also join.",
      "The application form is available on our website. Please print it out and mail it back to us by June 10. Please make sure your parents sign the application for you.",
      "Sincerely,",
      "Nicole Hoover",
    ],
    questions: [
      {
        id: 23,
        text: "Why is Nicole Hoover writing to Jeremy?",
        choices: ["To ask him what instrument he learned to play.", "To check his schedule for his music lessons.", "To answer the questions he asked about camps.", "To invite him to an event for teenagers."],
      },
      {
        id: 24,
        text: "What does Nicole Hoover say about children under 13?",
        choices: ["Their camp lasts one week longer.", "Their camp fee is not expensive.", "They cannot go to any Summer Fun camps.", "They can join a camp for kids."],
      },
    ],
  },
];

const writingTasks = examData.writingTasks || [
  {
    id: 30,
    label: "Eメール返信",
    targetWords: "40語〜50語",
    lead: "あなたは、外国人の知り合い（Alex）から、Eメールで質問を受け取りました。この質問にわかりやすく答える返信メールを、英文で書きなさい。",
    note: "AlexのEメール文中の下線部について、特徴を問う具体的な質問を2つしなさい。",
    sourceTitle: "AlexからのEメール",
    source: [
      "Hi!",
      "Guess what! My father bought me a robot pet last week online. I wanted to get a real dog, but my parents told me it is too difficult to take care of dogs.",
      "I am sending a picture of my robot with this e-mail. My robot is cute, but there is a problem. The battery does not last long. Do you think that robot pets will improve in the future?",
      "Your friend,",
      "Alex",
    ],
    fixedBefore: "Hi, Alex!\nThank you for your e-mail.",
    fixedAfter: "Best wishes,",
  },
  {
    id: 31,
    label: "意見論述",
    targetWords: "50語〜60語",
    lead: "QUESTIONについて、あなたの意見とその理由を2つ英文で書きなさい。",
    note: "解答がQUESTIONに対応していないと判断された場合は、0点と採点されることがあります。",
    sourceTitle: "QUESTION",
    source: ["Do you think students should take part in club activities at school?"],
    fixedBefore: "",
    fixedAfter: "",
  },
];

const listeningQuestions = examData.listeningQuestions || Array.from({ length: 30 }, (_, index) => {
  const id = index + 1;
  const section = id <= 10 ? "第1部" : id <= 20 ? "第2部" : "第3部";
  const choiceCount = id <= 10 ? 3 : 4;
  return {
    id,
    section,
    instruction:
      id <= 10
        ? "対話を聞き、その最後の文に対する応答として最も適切なものを選びなさい。"
        : "英文と質問を聞き、最も適切な答えを選びなさい。",
    choices: Array.from({ length: choiceCount }, (_, choiceIndex) => choiceIndex + 1),
  };
});

const speakingSteps = examData.speakingSteps || [
  {
    label: "Warm-up 1",
    time: "00 : 10",
    prompt: "面接官の質問を聞いて、マイクに向かって答えます。",
    visual: "面接官",
    recording: true,
  },
  {
    label: "Warm-up 2",
    time: "00 : 10",
    prompt: "もう一つ短い質問に答えます。準備時間はありません。",
    visual: "面接官",
    recording: true,
  },
  {
    label: "Silent Reading",
    time: "00 : 20",
    prompt: "カードの英文を黙読します。録音はまだ始まりません。",
    visual: "カード",
    recording: false,
  },
  {
    label: "Read Aloud",
    time: "00 : 45",
    prompt: "カードの英文を声に出して読みます。",
    visual: "カード",
    recording: true,
  },
  {
    label: "No.1",
    time: "00 : 30",
    prompt: "カードの内容についての質問に答えます。",
    visual: "カード",
    recording: true,
  },
  {
    label: "No.5",
    time: "00 : 15",
    prompt: "自分の考えを問う質問に答えます。",
    visual: "面接官",
    recording: true,
  },
];

const availableModuleKeys = new Set(Object.keys(modules).filter(isModuleAvailable));
const defaultModule = availableModuleKeys.has("reading") ? "reading" : availableModuleKeys.values().next().value || "reading";

const WRITTEN_EXAM_SECONDS = examData.writtenExamSeconds || 80 * 60;
const LISTENING_ANSWER_SECONDS = examData.listeningAnswerSeconds || 10;
const STORAGE_KEY = `scbt-${selectedGrade}-${selectedSet.key}-state`;
const LEGACY_STORAGE_KEY = `scbt-${selectedGrade}-prototype-state`;

const defaultState = {
  module: defaultModule,
  started: false,
  drawerOpen: true,
  readingPage: 0,
  readingItemIndex: 0,
  writingTask: 0,
  listeningIndex: 0,
  speakingStep: 0,
  writtenRemaining: WRITTEN_EXAM_SECONDS,
  listeningAnswerRemaining: LISTENING_ANSWER_SECONDS,
  speakingRemaining: getSpeakingStepSeconds(0),
  answers: {
    written: {},
    listening: {},
  },
  reviews: {},
  writingAnswers: {},
  writingChecks: {},
  speakingRecordings: {},
  speakingSelfChecks: {},
  speakingRecordMessage: "",
  reviewFilter: "all",
  clipboardText: "",
  importOpen: false,
  importDraft: "",
  importMessage: "",
  instructionOpen: false,
  modal: null,
};

const appState = loadState();
const speakingRecordingUrls = {};
let speakingRecorder = null;
let speakingRecorderStream = null;
let speakingRecorderChunks = [];
let speakingRecorderStep = null;
let listeningAudioElement = null;
let listeningPlaybackQuestionId = null;
let listeningPlaybackPhase = "idle";

const app = document.getElementById("app");
document.title = `${selectedGradeLabel}CBT形式4技能トレーニング`;
app.addEventListener("click", handleClick);
app.addEventListener("change", handleChange);
app.addEventListener("input", handleInput);

function render() {
  const moduleInfo = modules[appState.module];

  if (!appState.started) {
    stopListeningPlayback();
    app.innerHTML = renderStart(moduleInfo);
    return;
  }

  if (appState.modal === "complete") {
    stopListeningPlayback();
    app.innerHTML = renderComplete();
    return;
  }

  if (appState.module === "speaking") {
    stopListeningPlayback();
    app.innerHTML = renderSpeaking();
  } else if (appState.module === "listening") {
    ensureListeningPlaybackState();
    app.innerHTML = renderListening();
    mountListeningAudio();
  } else if (appState.module === "writing") {
    stopListeningPlayback();
    app.innerHTML = renderWriting();
  } else {
    stopListeningPlayback();
    app.innerHTML = renderReading();
  }
}

function renderStart(moduleInfo) {
  return `
    <section class="start-screen">
      ${renderGradePicker()}
      ${renderSetPicker()}
      <div class="start-title">${moduleInfo.title}</div>
      <button class="start-button" data-action="start">${moduleInfo.start}</button>
      ${renderModuleTabs("技能を選ぶ")}
      ${renderImportPanel()}
      ${renderLegalNotice()}
    </section>
  `;
}

function renderLegalNotice() {
  return `
    <section class="legal-notice">
      <strong>非公式の自主練習ツールです</strong>
      <p>英検®は公益財団法人 日本英語検定協会の登録商標です。本サービスは同協会の承認・推奨・検討を受けたものではありません。</p>
      <p>掲載している問題・音声台本・解説は独自作成です。利用規約、プライバシーポリシー、特定商取引法に基づく表記は販売前に整備します。</p>
    </section>
  `;
}

function renderHeader(statusText) {
  const isListening = appState.module === "listening";
  const isSpeaking = appState.module === "speaking";
  const isTimedWriting = !isListening && !isSpeaking;
  return `
    <header class="topbar">
      <div class="grade">
        <span>${selectedGradeDisplay}</span>
        <small>${escapeHtml(selectedSetLabel)}</small>
      </div>
      <div class="exam-title">${modules[appState.module].title}</div>
      <div class="${isTimedWriting ? "timer-pill" : "status-pill"}">
        <span class="${isTimedWriting ? "icon-clock" : "icon-sound"}"></span>
        <span class="${isTimedWriting ? "timer-label" : "status-label"}">${statusText}</span>
        ${isTimedWriting ? `<span data-written-timer>${formatClock(appState.writtenRemaining)}</span>` : ""}
      </div>
    </header>
    ${renderModuleTabs("技能を切り替える")}
  `;
}

function renderGradePicker() {
  if (isGradeLocked || availableGradeKeys.length <= 1) {
    return `<div class="grade-locked">${selectedGradeLabel}</div>`;
  }

  return `
    <section class="grade-picker" aria-label="級を選ぶ">
      <div class="grade-picker-title">受験級</div>
      <div class="grade-options">
        ${availableGradeKeys
          .map((key) => {
            const grade = gradeCatalog[key];
            return `
              <button class="grade-option ${key === selectedGrade ? "active" : ""}" data-grade="${key}">
                <span>${grade.label || key}</span>
                <small>${grade.displayName || key}${importedGradeOverrides[key] ? " / 取込中" : ""}</small>
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderSetPicker() {
  const sets = getGradeSets(gradeCatalog[selectedGrade] || examData, selectedGrade);
  if (sets.length <= 1) return "";

  return `
    <section class="set-picker" aria-label="模試回を選ぶ">
      <div class="set-picker-title">模試回</div>
      <div class="set-options">
        ${sets
          .map((set) => {
            const active = set.key === selectedSet.key;
            const disabled = !set.enabled;
            const statusText = set.importedFromExternalAi || (selectedSetImported && active) ? "取込データ" : set.description || (set.enabled ? "収録済み" : "準備中");
            return `
              <button class="set-option ${active ? "active" : ""}" data-set="${set.key}" ${disabled ? "disabled" : ""}>
                <span>${escapeHtml(set.label || set.key)}</span>
                <small>${escapeHtml(statusText)}</small>
              </button>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderImportPanel() {
  const requirement = GRADE_REQUIREMENTS[selectedGrade];
  const expectedText = requirement
    ? `リーディング ${requirement.readingPageCounts.join("+")}問 / リスニング ${requirement.listeningCount}問 / ライティング ${requirement.writingCount}題`
    : "この級の検証条件は未設定です。";

  return `
    <section class="import-panel ${appState.importOpen ? "open" : ""}">
      <button class="import-toggle" data-action="toggle-import">
        ${appState.importOpen ? "問題データ取込を閉じる" : "外部AI問題データを取り込む"}
      </button>
      ${
        appState.importOpen
          ? `
            <div class="import-body">
              <div class="import-status">
                <strong>${selectedGradeLabel}${selectedGradeImported ? "（外部AIデータ適用中）" : ""}</strong>
                <span>${expectedText}</span>
              </div>
              <textarea class="import-textarea" data-import-draft spellcheck="false" placeholder="外部AIが出力したJSONをここに貼り付けます。">${escapeHtml(appState.importDraft)}</textarea>
              <div class="import-actions">
                <button class="small-action" data-action="fill-import-template">雛形を入れる</button>
                <button class="small-action primary" data-action="import-questions">検証して保存</button>
                <button class="small-action danger" data-action="clear-imported-questions" ${selectedGradeImported ? "" : "disabled"}>取込データ解除</button>
              </div>
              ${appState.importMessage ? `<p class="import-message">${escapeHtml(appState.importMessage)}</p>` : ""}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function renderModuleTabs(label) {
  return `
    <nav class="module-picker" aria-label="${label}">
      ${Object.entries(modules)
        .map(
          ([key, item]) => `
            <button class="module-tab ${key === appState.module ? "active" : ""}" data-module="${key}" ${isModuleAvailable(key) ? "" : "disabled"}>
              ${item.label}
              ${isModuleAvailable(key) ? "" : `<small>準備中</small>`}
            </button>
          `,
        )
        .join("")}
      <button class="module-tab reset-tab" data-action="reset-progress">進行リセット</button>
    </nav>
  `;
}

function isModuleAvailable(moduleKey) {
  if (Array.isArray(examData.availableModules)) return examData.availableModules.includes(moduleKey);
  if (moduleKey === "reading") return Array.isArray(readingPages) && readingPages.length > 0;
  if (moduleKey === "writing") return Array.isArray(writingTasks) && writingTasks.length > 0;
  if (moduleKey === "listening") return Array.isArray(listeningQuestions) && listeningQuestions.length > 0;
  if (moduleKey === "speaking") return Array.isArray(speakingSteps) && speakingSteps.length > 0;
  return false;
}

function renderReading() {
  const page = readingPages[appState.readingPage];
  const visibleQuestions = getVisibleReadingQuestions(page);
  const frameClass = [
    "reading-frame",
    page.kind === "long" ? "reading-long-frame" : "reading-choice-frame",
    appState.instructionOpen ? "instruction-open" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    ${renderHeader("残り時間")}
    <section class="exam-frame ${frameClass}">
      <div class="content-panel">
        ${renderPageStrip(readingPages, appState.readingPage)}
        ${renderReadingInstruction(page)}
        <button class="nav-button prev" data-action="reading-prev" ${isAtFirstReadingItem() ? "disabled" : ""}>▲ 前の問題へ</button>
        <div class="scroll-panel">
          ${page.kind === "long" ? renderLongReadingPage(page, visibleQuestions) : visibleQuestions.map(renderChoiceQuestion).join("")}
        </div>
        <button class="nav-button next" data-action="reading-next">${getReadingNextLabel()}</button>
      </div>
      ${renderAnswerDrawer()}
      ${renderModal()}
    </section>
  `;
}

function renderPageStrip(pages, current) {
  return `
    <div class="page-strip">
      ${pages
        .map(
          (page, index) => `
            <button class="page-pill ${index === current ? "active" : ""}" data-action="reading-goto" data-page="${index}">
              ${escapeHtml(getReadingPageDisplayLabel(page, index))}
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function getReadingPageDisplayLabel(page, index) {
  const label = page?.label || "";
  if (label.includes("短文")) return "Part 1 語彙";
  if (label.includes("2A")) return "Part 2A 文脈補充";
  if (label.includes("2B")) return "Part 2B 文脈補充";
  if (label.includes("メール")) return "Part 3A メール";
  if (label.includes("3A")) return "Part 3A 読解";
  if (label.includes("3B")) return "Part 3B 長文";
  return `Part ${index + 1}`;
}

function renderReadingInstruction(page) {
  return `
    <div class="reading-instruction ${appState.instructionOpen ? "open" : ""}">
      <button class="instruction-toggle" data-action="toggle-instruction" aria-label="${appState.instructionOpen ? "指示文を閉じる" : "指示文を開く"}">
        <span>${appState.instructionOpen ? "閉じる" : "指示を表示"}</span>
      </button>
      ${
        appState.instructionOpen
          ? `
            <div class="instruction-content">
              <span class="instruction-badge">${escapeHtml(getReadingInstructionBadge(page))}</span>
              <p>${escapeHtml(getReadingInstructionText(page))}</p>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function getReadingInstructionBadge(page) {
  const label = page.label || "";
  if (label.includes("2A")) return "2-A";
  if (label.includes("2B")) return "2-B";
  if (label.includes("3A")) return "3-A";
  if (label.includes("3B")) return "3-B";
  return "1";
}

function getReadingInstructionText(page) {
  const label = page.label || "";
  if (label.includes("短文")) {
    return "空所を含む英文を読み、文意に合う語句を4つの選択肢から選んでください。";
  }
  if (label.includes("長文語句")) {
    return "英文の流れを確認し、空所に入れると最も自然な語句を選択してください。";
  }
  if (label.includes("メール")) {
    return "Eメールの内容を読み、各質問に対して最も合う答えを選んでください。";
  }
  return "英文全体の内容を読み、各質問に対して最も適切な選択肢を選んでください。";
}

function renderChoiceQuestion(question) {
  return `
    <article class="question-block" id="q-${question.id}">
      <div class="question-number">(${question.id})</div>
      <div>
        ${renderQuestionText(question)}
        ${question.choices
          .map(
            (choice, index) => `
              <div class="choice-row">
                <span class="choice-button choice-marker" aria-hidden="true">
                  ${index + 1}
                </span>
                <span>${escapeHtml(choice)}</span>
              </div>
            `,
          )
          .join("")}
        ${renderReview(question.id, "あとで見直す")}
      </div>
    </article>
  `;
}

function getReadingStepSize(page = readingPages[appState.readingPage]) {
  return page?.kind === "long" ? 1 : 2;
}

function getLastReadingItemIndex(page) {
  const count = page?.questions?.length || 0;
  if (count <= 0) return 0;
  const step = getReadingStepSize(page);
  return Math.floor((count - 1) / step) * step;
}

function getCurrentReadingItemIndex(page = readingPages[appState.readingPage]) {
  const lastIndex = getLastReadingItemIndex(page);
  return Math.min(Math.max(Number(appState.readingItemIndex) || 0, 0), lastIndex);
}

function getVisibleReadingQuestions(page) {
  const step = getReadingStepSize(page);
  const start = getCurrentReadingItemIndex(page);
  return (page?.questions || []).slice(start, start + step);
}

function isAtFirstReadingItem() {
  return appState.readingPage === 0 && getCurrentReadingItemIndex() === 0;
}

function isAtLastReadingItem() {
  const page = readingPages[appState.readingPage];
  return appState.readingPage === readingPages.length - 1 && getCurrentReadingItemIndex(page) >= getLastReadingItemIndex(page);
}

function getReadingNextLabel() {
  return isAtLastReadingItem() ? "ライティングへ ▼" : "次の問題へ ▼";
}

function renderQuestionText(question) {
  const lines = formatQuestionText(question.text, question.id);
  return `
    <p class="question-text">
      ${lines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
    </p>
  `;
}

function formatQuestionText(text, id) {
  const withoutNumber = stripLeadingQuestionNumber(String(text || ""), id);
  const withDialogueBreaks = withoutNumber.replace(/\s+([A-Z]):\s+/g, "\n$1: ");
  return withDialogueBreaks
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripLeadingQuestionNumber(text, id) {
  return text.replace(new RegExp(`^\\s*\\(?\\s*${id}\\s*\\)\\s*`), "");
}

function renderLongReadingPage(page, visibleQuestions = getVisibleReadingQuestions(page)) {
  return `
    <div class="long-layout">
      <section>
        ${renderToolRow()}
        ${renderPassageCard(page)}
      </section>
      <section class="side-question">
        ${visibleQuestions.map(renderCompactChoiceQuestion).join("")}
      </section>
    </div>
  `;
}

function renderPassageCard(page, className = "") {
  const extraClass = className ? ` ${className}` : "";
  return `
    <div class="passage-card${extraClass}">
      <strong>${escapeHtml(page.passageTitle || page.label || "長文")}</strong>
      ${(page.passage || []).map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br />")).join("")}
    </div>
  `;
}

function renderReadingFullView(page) {
  if (page.kind === "long") {
    return `
      <div class="reading-full-passage-only">
        ${renderPassageCard(page, "full-passage-card")}
      </div>
    `;
  }

  return `
    <div class="reading-full-choice">
      ${page.questions.map(renderChoiceQuestion).join("")}
    </div>
  `;
}

function renderCompactChoiceQuestion(question) {
  return `
    <article class="compact-question" id="q-${question.id}">
      <div class="compact-question-text">
        <strong>(${question.id})</strong>
        <div>${formatQuestionText(question.text, question.id).map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</div>
      </div>
      ${question.choices
        .map(
          (choice, index) => `
            <div class="choice-row compact">
              <span class="choice-button choice-marker" aria-hidden="true">
                ${index + 1}
              </span>
              <span>${escapeHtml(choice)}</span>
            </div>
          `,
        )
        .join("")}
      ${renderReview(question.id, "あとで見直す")}
    </article>
  `;
}

function renderWriting() {
  const task = writingTasks[appState.writingTask];
  const value = appState.writingAnswers[task.id] || "";
  const wordStatus = getWordStatus(task, value);
  return `
    ${renderHeader("残り時間")}
    <section class="exam-frame">
      <div class="content-panel">
        <div class="page-strip">
          ${writingTasks
            .map(
              (item, index) => `
                <button class="page-pill ${index === appState.writingTask ? "active" : ""}" data-action="writing-goto" data-page="${index}">
                  ${item.id}. ${item.label}
                </button>
              `,
            )
            .join("")}
        </div>
        <button class="nav-button prev" data-action="writing-prev" ${appState.writingTask === 0 ? "disabled" : ""}>▲ 前の問題へ</button>
        <div class="scroll-panel">
          <div class="writing-layout">
            <section>
              <div class="writing-prompt">
                <p>● ${escapeHtml(task.lead)}</p>
                <p>● ${escapeHtml(task.note)}</p>
                <p>● ${escapeHtml(task.wordRule || "語数の目安")}は${escapeHtml(task.targetWords)}です。</p>
              </div>
              ${renderWritingConditions(task)}
              ${renderToolRow()}
              <div class="email-card">
                <strong>${escapeHtml(task.sourceTitle)}</strong>
                ${task.source.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
              </div>
              ${renderWritingPoints(task)}
            </section>
            <section class="writing-answer">
              <h3>解答欄</h3>
              ${task.fixedBefore ? `<p>${escapeHtml(task.fixedBefore).replace(/\n/g, "<br />")}</p>` : ""}
              <div class="word-row">
                <span data-word-status class="word-status ${wordStatus.className}">${escapeHtml(wordStatus.label)}</span>
                <strong data-word-count class="word-count ${wordStatus.className}">${wordStatus.count}語</strong>
              </div>
              <textarea class="writing-textarea" data-writing-id="${task.id}">${escapeHtml(value)}</textarea>
              ${task.fixedAfter ? `<p>${escapeHtml(task.fixedAfter)}</p>` : ""}
              ${renderWritingSelfCheck(task)}
              <div class="writing-actions">
                <button class="small-action" data-action="copy-writing">コピー</button>
                <button class="small-action" data-action="paste-demo">貼り付け</button>
                <button class="small-action" data-action="show-full">全体参照</button>
                ${renderReview(task.id, "あとで見直す")}
              </div>
            </section>
          </div>
        </div>
        <button class="nav-button next" data-action="writing-next">${appState.writingTask === writingTasks.length - 1 ? "結果へ ▼" : "次の問題へ ▼"}</button>
      </div>
      ${renderAnswerDrawer()}
      ${renderModal()}
    </section>
  `;
}

function renderToolRow() {
  return `
    <div class="tool-row">
      <button class="tool-button icon-tool pen-tool active" title="赤ペン" aria-label="赤ペン">
        ${renderToolIcon("pen")}
        <span class="sr-only">赤ペン</span>
      </button>
      <button class="tool-button icon-tool marker-tool" title="マーカー" aria-label="マーカー">
        ${renderToolIcon("marker")}
        <span class="sr-only">マーカー</span>
      </button>
      <button class="tool-button icon-tool eraser-tool" title="消しゴム" aria-label="消しゴム">
        ${renderToolIcon("eraser")}
        <span class="sr-only">消しゴム</span>
      </button>
      <button class="full-view-button icon-tool" data-action="show-full" title="全体表示" aria-label="全体表示">
        ${renderToolIcon("fullscreen")}
        <span class="sr-only">全体表示</span>
      </button>
    </div>
  `;
}

function renderToolIcon(name) {
  const icons = {
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4.4-1 9.9-9.9-3.4-3.4L5 15.6 4 20z"></path><path d="M13.7 6.9l3.4 3.4"></path></svg>',
    marker: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18l2.5-5.5L16 4l4 4-8.5 8.5L6 19z"></path><path d="M8 21h10"></path></svg>',
    eraser: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15l8-8 8 8-5 5H9z"></path><path d="M9 20h11"></path></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5"></path><path d="M20 9V4h-5"></path><path d="M4 15v5h5"></path><path d="M20 15v5h-5"></path></svg>',
  };
  return icons[name] || "";
}

function renderWritingPoints(task) {
  if (!task.points || task.points.length === 0) return "";

  return `
    <div class="points-card">
      <strong>POINTS</strong>
      <p>${escapeHtml(task.pointsRule || "理由を書く際の参考となる観点です。")}</p>
      <div class="points-list">
        ${task.points.map((point) => `<span>${escapeHtml(point)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderWritingConditions(task) {
  const rubric = Array.isArray(task.rubric) ? task.rubric : [];
  return `
    <div class="writing-condition-card">
      <div>
        <strong>条件</strong>
        <p>語数: ${escapeHtml(task.targetWords || "指定なし")}</p>
        ${task.pointsRule ? `<p>POINTS: ${escapeHtml(task.pointsRule)}</p>` : ""}
      </div>
      ${
        rubric.length
          ? `<ul class="rubric-list">${rubric.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
          : ""
      }
    </div>
  `;
}

function renderWritingSelfCheck(task) {
  const items = getWritingCheckItems(task);
  const checkedItems = appState.writingChecks[task.id] || {};
  if (items.length === 0) return "";

  return `
    <div class="self-check-card">
      <div class="self-check-head">
        <strong>自己チェック</strong>
        <span>提出前に確認</span>
      </div>
      <div class="self-check-list">
        ${items
          .map(
            (item, index) => `
              <label>
                <input
                  type="checkbox"
                  data-writing-check-task="${task.id}"
                  data-writing-check="${index}"
                  ${checkedItems[index] ? "checked" : ""}
                />
                <span>${escapeHtml(item)}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderAnswerDrawer() {
  const groups = buildAnswerGroups();

  return `
    <aside class="answer-drawer ${appState.drawerOpen ? "" : "closed"}">
      <button class="drawer-toggle" data-action="toggle-drawer">${appState.drawerOpen ? "◀" : "▶"}</button>
      <div class="drawer-body">
        <div class="drawer-title">解答パネル</div>
        <div class="answer-list">
          ${groups.map(renderAnswerGroup).join("")}
        </div>
        <button class="finish-button" data-action="show-finish">テストを終了して結果へ</button>
      </div>
    </aside>
  `;
}

function buildAnswerGroups() {
  const readingGroups = readingPages.map((page, index) => ({
    number: index + 1,
    label: getReadingPageDisplayLabel(page, index),
    rows: page.questions.map((question) => ({ id: question.id, type: "choice" })),
  }));

  const writingGroups = writingTasks.map((task, index) => ({
    number: readingGroups.length + index + 1,
    label: task.label,
    rows: [{ id: task.id, type: "writing" }],
  }));

  return [...readingGroups, ...writingGroups];
}

function renderAnswerGroup(group) {
  return `
    <section class="answer-group" aria-label="${escapeHtml(group.label)}">
      <div class="answer-group-badge">${group.number}</div>
      <div class="answer-group-body">
        ${group.rows.map(renderAnswerRow).join("")}
      </div>
    </section>
  `;
}

function renderAnswerRow(row) {
  const answer = appState.answers.written[row.id];
  const writingValue = appState.writingAnswers[row.id] || "";
  const isCurrent = isCurrentWrittenItem(row.id);
  return `
    <div class="answer-row ${row.type === "writing" ? "writing-row" : ""} ${isCurrent ? "current" : ""}">
      <button class="question-jump" data-action="jump-written" data-question="${row.id}">( ${row.id} )</button>
      <input type="checkbox" data-review-question="${row.id}" ${appState.reviews[row.id] ? "checked" : ""} />
      ${
        row.type === "choice"
          ? [1, 2, 3, 4]
              .map(
                (choice) => `
                  <button class="answer-cell ${answer === choice ? "selected" : ""}" data-action="written-answer" data-question="${row.id}" data-value="${choice}">
                    ${choice}
                  </button>
                `,
              )
              .join("")
          : `<span class="writing-status">${writingValue.trim() ? `${countWords(writingValue)}語` : "未入力"}</span>`
      }
    </div>
  `;
}

function isCurrentWrittenItem(id) {
  if (appState.module === "reading") {
    return readingPages[appState.readingPage].questions.some((question) => question.id === id);
  }
  if (appState.module === "writing") {
    return writingTasks[appState.writingTask].id === id;
  }
  return false;
}

function getReadingQuestionIds() {
  return readingPages.flatMap((page) => page.questions.map((question) => question.id));
}

function getWrittenItemIds() {
  return [...getReadingQuestionIds(), ...writingTasks.map((task) => task.id)];
}

function renderReview(id, text) {
  return `
    <label class="review-label">
      <input type="checkbox" data-review-question="${id}" ${appState.reviews[id] ? "checked" : ""} />
      <span>${text}</span>
    </label>
  `;
}

function stopListeningPlayback() {
  if (listeningAudioElement) {
    listeningAudioElement.pause();
    listeningAudioElement.removeAttribute("src");
    listeningAudioElement.load();
  }
  listeningAudioElement = null;
  listeningPlaybackQuestionId = null;
  listeningPlaybackPhase = "idle";
}

function ensureListeningPlaybackState() {
  const question = listeningQuestions[appState.listeningIndex];
  if (!question || listeningPlaybackQuestionId === question.id) return;
  stopListeningPlayback();
  listeningPlaybackQuestionId = question.id;
  listeningPlaybackPhase = question.audioFile ? "audio" : "answer";
  appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
}

function updateListeningPlaybackUi() {
  const question = listeningQuestions[appState.listeningIndex];
  const hasAudio = Boolean(question?.audioFile);
  const isAnswerPhase = !hasAudio || listeningPlaybackPhase === "answer";
  const status = app.querySelector("[data-listening-audio-status] span");
  const playButton = app.querySelector('[data-action="listen-play"]');
  const answerTime = app.querySelector(".answer-time");
  const phaseLabel = app.querySelector("[data-listening-phase-label]");
  const timer = app.querySelector("[data-listening-timer]");
  const timerUnit = app.querySelector("[data-listening-timer-unit]");
  const timerBar = app.querySelector("[data-listening-answer-bar]");

  if (status) {
    status.textContent = !hasAudio
      ? "音声ファイル未設定（仮スクリプトで問題管理中）"
      : listeningPlaybackPhase === "answer"
        ? "音声が終了しました。解答を選んでください。"
        : listeningPlaybackPhase === "blocked" || listeningPlaybackPhase === "error"
          ? "音声を再生するには再生ボタンを押してください。"
          : "音声を再生しています。";
  }
  if (playButton) playButton.hidden = !["blocked", "error"].includes(listeningPlaybackPhase);
  if (answerTime) answerTime.classList.toggle("waiting", !isAnswerPhase);
  const audioPhaseLabel = ["blocked", "error"].includes(listeningPlaybackPhase) ? "音声再生待ち" : "音声再生中";
  if (phaseLabel) phaseLabel.textContent = isAnswerPhase ? "解答時間" : audioPhaseLabel;
  if (timer) timer.textContent = isAnswerPhase ? appState.listeningAnswerRemaining : "--";
  if (timerUnit) timerUnit.textContent = isAnswerPhase ? "秒" : "";
  if (timerBar) {
    const percent = isAnswerPhase ? Math.max(0, Math.min(100, (appState.listeningAnswerRemaining / LISTENING_ANSWER_SECONDS) * 100)) : 100;
    timerBar.style.width = `${percent}%`;
  }
}

async function playListeningAudio() {
  const question = listeningQuestions[appState.listeningIndex];
  if (!question?.audioFile) return;
  const audio = listeningAudioElement || app.querySelector("[data-listening-audio]");
  if (!audio) return;
  listeningAudioElement = audio;
  listeningPlaybackPhase = "audio";
  updateListeningPlaybackUi();
  try {
    audio.currentTime = 0;
    await audio.play();
  } catch {
    listeningPlaybackPhase = "blocked";
    updateListeningPlaybackUi();
  }
}

function mountListeningAudio() {
  const question = listeningQuestions[appState.listeningIndex];
  if (!question?.audioFile || listeningPlaybackPhase === "answer") {
    updateListeningPlaybackUi();
    return;
  }
  const audio = app.querySelector("[data-listening-audio]");
  if (!audio) return;
  const questionId = question.id;
  listeningAudioElement = audio;
  audio.addEventListener("playing", () => {
    if (listeningPlaybackQuestionId !== questionId) return;
    listeningPlaybackPhase = "audio";
    updateListeningPlaybackUi();
  });
  audio.addEventListener("ended", () => {
    if (listeningPlaybackQuestionId !== questionId) return;
    listeningPlaybackPhase = "answer";
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
    saveState();
    updateListeningPlaybackUi();
  });
  audio.addEventListener("error", () => {
    if (listeningPlaybackQuestionId !== questionId) return;
    listeningPlaybackPhase = "error";
    updateListeningPlaybackUi();
  });
  playListeningAudio();
}

function renderListening() {
  const question = listeningQuestions[appState.listeningIndex];
  const hasAudio = Boolean(question.audioFile);
  const isRealLifeQuestion = question.part === "Part 3" && Boolean(question.situation);
  const isAnswerPhase = !hasAudio || listeningPlaybackPhase === "answer";
  const audioStatusText = !hasAudio
    ? "音声ファイル未設定（仮スクリプトで問題管理中）"
    : listeningPlaybackPhase === "answer"
      ? "音声が終了しました。解答を選んでください。"
      : listeningPlaybackPhase === "blocked" || listeningPlaybackPhase === "error"
        ? "音声を再生するには再生ボタンを押してください。"
        : "音声を再生しています。";
  return `
    ${renderHeader(`${question.section} No.${question.id}を再生中...`)}
    <section class="listen-frame">
      <main class="listen-main">
        <div class="section-description">
          <div class="section-badge">${question.section}</div>
          <p>${question.instruction}</p>
        </div>
        <div class="audio-status ${hasAudio ? "" : "muted"}" data-listening-audio-status>
          <span>${audioStatusText}</span>
          ${hasAudio ? `<button class="listen-play-button" data-action="listen-play" ${listeningPlaybackPhase === "blocked" || listeningPlaybackPhase === "error" ? "" : "hidden"}>▶ 音声を再生</button>` : ""}
        </div>
        ${hasAudio ? `<audio class="listen-audio-element" data-listening-audio preload="auto" src="${escapeHtml(question.audioFile)}"></audio>` : ""}
        <button class="nav-button prev" data-action="listen-prev" ${appState.listeningIndex === 0 ? "disabled" : ""}>▲ 前の問題へ</button>
        <div class="listen-question">
          <p class="listen-question-number">No.${question.id}</p>
          ${
            isRealLifeQuestion
              ? `<div class="listen-real-life">
                  <p><strong>Situation</strong>${escapeHtml(question.situation)}</p>
                  <p><strong>Question</strong>${escapeHtml(question.questionText || question.text || "")}</p>
                </div>`
              : ""
          }
          ${question.choices
            .map((choice, index) => {
              const value = index + 1;
              const choiceText = typeof choice === "number" ? "" : String(choice);
              return `
                <button class="listen-choice ${appState.answers.listening[question.id] === value ? "selected" : ""}" data-action="listen-answer" data-question="${question.id}" data-value="${value}">
                  <span class="listen-choice-number">${value}</span>
                  ${choiceText ? `<span class="listen-choice-text">${escapeHtml(choiceText)}</span>` : ""}
                </button>
              `;
            })
            .join("")}
          ${renderReview(`l-${question.id}`, "目印をつける")}
        </div>
        <button class="nav-button next" data-action="listen-next">${appState.listeningIndex === listeningQuestions.length - 1 ? "リスニング終了 ▼" : "次の問題へ ▼"}</button>
        <div class="answer-time ${isAnswerPhase ? "" : "waiting"}">
          <span data-listening-phase-label>${isAnswerPhase ? "解答時間" : ["blocked", "error"].includes(listeningPlaybackPhase) ? "音声再生待ち" : "音声再生中"}</span>
          <div class="answer-time-meter">
            <div class="answer-time-track" aria-hidden="true"><span data-listening-answer-bar style="width: ${isAnswerPhase ? Math.max(0, Math.min(100, (appState.listeningAnswerRemaining / LISTENING_ANSWER_SECONDS) * 100)) : 100}%"></span></div>
            <div class="answer-time-box"><span data-listening-timer>${isAnswerPhase ? appState.listeningAnswerRemaining : "--"}</span><span data-listening-timer-unit>${isAnswerPhase ? "秒" : ""}</span></div>
          </div>
        </div>
      </main>
      <aside class="listen-side">
        <button class="current-button" data-action="listen-current">再生中の問題を表示する</button>
        <div class="listen-list">
          ${listeningQuestions
            .map(
              (item, index) => `
                <div class="listen-list-row ${index === appState.listeningIndex ? "current" : ""}">
                  <button class="listen-jump" data-action="listen-goto" data-page="${index}">No.${item.id}</button>
                  <input class="listen-mark" type="checkbox" data-review-question="l-${item.id}" ${appState.reviews[`l-${item.id}`] ? "checked" : ""} />
                  <button class="listen-box ${appState.answers.listening[item.id] ? "answered" : ""}" data-action="listen-goto" data-page="${index}">
                    ${appState.answers.listening[item.id] || ""}
                  </button>
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="volume-box">
          <strong>音量</strong>
          <div class="volume-row">
            <span>小</span>
            <input type="range" min="0" max="100" value="60" />
            <span>大</span>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderSpeaking() {
  const step = speakingSteps[appState.speakingStep];
  const stepIndex = appState.speakingStep;
  return `
    ${renderHeader("音量調整")}
    <section class="speaking-frame">
      <div class="speaking-head">
        <div>${selectedGradeDisplay}</div>
        <label class="volume-row">
          <span>音量調整</span>
          <span>小</span>
          <input type="range" min="0" max="100" value="60" />
          <span>大</span>
        </label>
      </div>
      <div class="speaking-body">
        <div class="interviewer ${step.visual === "カード" ? "card-visual" : ""}">
          ${renderSpeakingVisual(step)}
        </div>
        <aside class="speaking-card">
          <div class="speaking-step-list">
            ${speakingSteps
              .map(
                (item, index) => `
                  <button class="step-dot ${index === appState.speakingStep ? "active" : ""}" data-action="speaking-goto" data-page="${index}">
                    ${index + 1}
                  </button>
                `,
              )
              .join("")}
          </div>
          <h2>${step.label}</h2>
          <p>${step.prompt}</p>
          ${renderSpeakingMaterial(step)}
          <p>残り時間 <strong data-speaking-timer>${formatClock(appState.speakingRemaining)}</strong></p>
          <div class="recording-box ${step.recording ? "" : "standby"}">
            <div class="mic-icon">${step.recording ? "REC" : "WAIT"}</div>
            <div>
              <strong>${step.recording ? "録音対象" : "準備中"}</strong>
              <p>${step.recording ? "マイクを許可して録音し、あとでAI評価用ファイルとして書き出せます。" : "画面を確認し、次の指示を待ちます。"}</p>
            </div>
          </div>
          ${renderSpeakingRecorder(step, stepIndex)}
          ${renderSpeakingSelfCheck(step, stepIndex)}
          <div class="speaking-actions">
            <button class="small-action" data-action="speaking-prev" ${appState.speakingStep === 0 ? "disabled" : ""}>戻る</button>
            <button class="small-action" data-action="speaking-next">${appState.speakingStep === speakingSteps.length - 1 ? "終了" : "次へ"}</button>
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderSpeakingVisual(step) {
  if (step.cardText) {
    return `
      <div class="speaking-visual-card">
        <strong>${escapeHtml(step.cardTitle || "Card")}</strong>
        <p>${escapeHtml(step.cardText)}</p>
      </div>
    `;
  }

  if (step.pictureText) {
    return `
      <div class="speaking-picture-card">
        <strong>Picture</strong>
        <p>${escapeHtml(step.pictureText)}</p>
      </div>
    `;
  }

  return `<div class="face-placeholder">${escapeHtml(step.visual || "面接官")}</div>`;
}

function renderSpeakingMaterial(step) {
  const blocks = [];
  if (step.questionText) {
    blocks.push(`
      <div class="speaking-material">
        <strong>Question</strong>
        <p>${escapeHtml(step.questionText)}</p>
      </div>
    `);
  }
  if (step.pictureText) {
    blocks.push(`
      <div class="speaking-material">
        <strong>Picture prompt</strong>
        <p>${escapeHtml(step.pictureText)}</p>
      </div>
    `);
  }
  return blocks.join("");
}

function renderSpeakingRecorder(step, stepIndex) {
  if (!step.recording) {
    return `
      <div class="speaking-recorder standby">
        <strong>録音なし</strong>
        <p>このステップは準備・黙読用です。録音ファイルは作成しません。</p>
      </div>
    `;
  }

  const recording = appState.speakingRecordings[stepIndex];
  const url = speakingRecordingUrls[stepIndex] || "";
  const isRecording = isSpeakingRecordingActive(stepIndex);
  const formatLabel = getRecordingFormatLabel(recording?.type || getSupportedRecordingMimeType());

  return `
    <div class="speaking-recorder ${isRecording ? "active" : ""}">
      <div class="recorder-head">
        <strong>${isRecording ? "録音中" : "録音"}</strong>
        <span>${formatLabel}</span>
      </div>
      <p>${escapeHtml(appState.speakingRecordMessage || "録音後、再生・ダウンロード・AI提出用コピーができます。")}</p>
      <div class="recorder-actions">
        ${
          isRecording
            ? `<button class="small-action danger" data-action="speaking-record-stop">停止して保存</button>`
            : `<button class="small-action" data-action="speaking-record-start">録音開始</button>`
        }
        ${
          recording
            ? `
              <button class="small-action" data-action="speaking-record-download" data-step="${stepIndex}">ダウンロード</button>
              <button class="small-action" data-action="speaking-record-copy" data-step="${stepIndex}">AI用にコピー</button>
            `
            : ""
        }
      </div>
      ${
        recording
          ? `
            <div class="recording-file">
              <span>${escapeHtml(recording.fileName || buildSpeakingRecordingFileName(stepIndex, recording.type))}</span>
              <small>${formatBytes(recording.size || 0)}</small>
            </div>
            ${
              url
                ? `<audio class="speaking-audio" controls src="${url}"></audio>`
                : `<p class="recording-note">保存済み音声を読み込み中です。</p>`
            }
          `
          : ""
      }
    </div>
  `;
}

function renderSpeakingSelfCheck(step, stepIndex) {
  if (!step.recording) return "";
  const checkedItems = appState.speakingSelfChecks[stepIndex] || {};
  const items = ["声が聞き取れる", "質問に直接答えた", "理由や説明を入れた", "大きな沈黙が少ない"];

  return `
    <div class="speaking-self-check">
      <div class="self-check-head">
        <strong>自己評価</strong>
        <span>録音後に確認</span>
      </div>
      <div class="self-check-list">
        ${items
          .map(
            (item, index) => `
              <label>
                <input
                  type="checkbox"
                  data-speaking-check-step="${stepIndex}"
                  data-speaking-check="${index}"
                  ${checkedItems[index] ? "checked" : ""}
                />
                <span>${escapeHtml(item)}</span>
              </label>
            `,
          )
          .join("")}
      </div>
      <textarea class="speaking-memo" data-speaking-memo="${stepIndex}" placeholder="自分用メモ">${escapeHtml(checkedItems.memo || "")}</textarea>
    </div>
  `;
}

function renderModal() {
  if (appState.modal === "finish") {
    const summary = getWrittenSummary();
    return `
      <div class="modal-backdrop">
        <div class="confirm-modal">
          <h2>テストの終了</h2>
          <p>解答済み ${summary.answered}/${summary.total} 問、未解答 ${summary.unanswered} 問、見直し ${summary.reviewed} 問です。</p>
          <p>一度「はい」を押すと、このテストには戻れません。未解答の問題や見直したい問題が残っている場合は、「いいえ」を押して戻ってください。</p>
          <div class="modal-actions">
            <button data-action="complete-exam">はい</button>
            <button data-action="close-modal">いいえ</button>
          </div>
        </div>
      </div>
    `;
  }

  if (appState.modal === "full") {
    const task = writingTasks[appState.writingTask] || writingTasks[0];
    return `
      <div class="modal-backdrop">
        <div class="full-modal">
          <button class="modal-close" data-action="close-modal">×</button>
          <div class="email-card">
            <strong>${escapeHtml(task.sourceTitle)}</strong>
            ${task.source.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          </div>
          ${renderWritingPoints(task)}
        </div>
      </div>
    `;
  }

  if (appState.modal === "full-reading") {
    const page = readingPages[appState.readingPage];
    return `
      <div class="modal-backdrop reading-full-backdrop">
        <div class="full-modal reading-full-modal">
          <button class="modal-close" data-action="close-modal">×</button>
          <div class="reading-full-head">
            <strong>${escapeHtml(getReadingPageDisplayLabel(page, appState.readingPage))}</strong>
            <span>全体表示</span>
          </div>
          ${renderPageStrip(readingPages, appState.readingPage)}
          <div class="reading-full-scroll">
            ${renderReadingFullView(page)}
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function renderComplete() {
  const summary = getExamSummary();
  return `
    <section class="start-screen result-screen">
      <div class="start-title">試験終了</div>
      <div class="result-grid">
        <article class="result-card">
          <span>リーディング</span>
          <strong>${summary.reading.correct}/${summary.reading.total}</strong>
          <small>未解答 ${summary.reading.unanswered} 問</small>
        </article>
        <article class="result-card">
          <span>リスニング</span>
          <strong>${summary.listening.correct}/${summary.listening.total}</strong>
          <small>未解答 ${summary.listening.unanswered} 問</small>
        </article>
        <article class="result-card">
          <span>ライティング</span>
          <strong>${summary.writing.answered}/${summary.writing.total}</strong>
          <small>入力済みタスク数</small>
        </article>
        <article class="result-card">
          <span>全体状況</span>
          <strong>${summary.answered}/${summary.total}</strong>
          <small>未解答 ${summary.unanswered} 問 / 見直し ${summary.reviewed} 問</small>
        </article>
      </div>
      ${renderReviewBoard()}
      <button class="start-button" data-action="restart">最初に戻る</button>
    </section>
  `;
}

function renderReviewBoard() {
  const filter = getReviewFilter();
  const readingItems = filterReviewQuestions(getReadingQuestions(), appState.answers.written, "reading", filter);
  const listeningItems = filterReviewQuestions(listeningQuestions, appState.answers.listening, "listening", filter);
  const writingItems = filterWritingReviewTasks(writingTasks, filter);

  return `
    <section class="review-board" aria-label="復習">
      <div class="review-board-head">
        <h2>復習</h2>
        <span>正答・誤答・未解答と解説を確認できます。</span>
      </div>
      <div class="review-filter-bar" aria-label="復習フィルター">
        ${renderReviewFilterButton("all", "すべて")}
        ${renderReviewFilterButton("wrong", "間違いだけ")}
        ${renderReviewFilterButton("unanswered", "未解答だけ")}
        ${renderReviewFilterButton("marked", "見直しだけ")}
      </div>
      <div class="review-columns">
        <section>
          <h3>リーディング</h3>
          <div class="review-list">
            ${renderReviewList(readingItems.map((question) => renderReviewItem(question, appState.answers.written, "reading")))}
          </div>
        </section>
        <section>
          <h3>リスニング</h3>
          <div class="review-list">
            ${renderReviewList(listeningItems.map((question) => renderReviewItem(question, appState.answers.listening, "listening")))}
          </div>
        </section>
        <section>
          <h3>ライティング</h3>
          <div class="review-list">
            ${renderReviewList(writingItems.map((task) => renderWritingReviewItem(task)))}
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderReviewFilterButton(value, label) {
  return `
    <button class="review-filter ${getReviewFilter() === value ? "active" : ""}" data-action="review-filter" data-filter="${value}">
      ${label}
    </button>
  `;
}

function renderReviewList(items) {
  return items.length ? items.join("") : `<div class="review-empty">該当する問題はありません。</div>`;
}

function renderReviewItem(question, answers, type) {
  const selected = answers[question.id];
  const hasCorrect = Number.isInteger(question.correct);
  const status = !selected ? "未解答" : hasCorrect && selected === question.correct ? "正解" : hasCorrect ? "不正解" : "確認";
  const statusClass = !selected ? "unanswered" : hasCorrect && selected === question.correct ? "correct" : hasCorrect ? "wrong" : "neutral";
  const reviewId = getReviewId(question.id, type);
  const marked = Boolean(appState.reviews[reviewId]);
  const promptText = type === "listening" ? question.questionText || question.text || `No.${question.id}` : question.text || `No.${question.id}`;
  const selectedText = selected ? `${selected}. ${getChoiceText(question, selected)}` : "未解答";
  const correctText = hasCorrect ? `${question.correct}. ${getChoiceText(question, question.correct)}` : "正答未設定";

  return `
    <details class="review-item ${statusClass} ${marked ? "is-marked" : ""}">
      <summary>
        <span>No.${question.id}</span>
        <strong>${status}</strong>
        <small>${marked ? "見直し / " : ""}あなた: ${escapeHtml(selectedText)} / 正答: ${escapeHtml(correctText)}</small>
      </summary>
      <div class="review-detail">
        <p>${escapeHtml(promptText)}</p>
        ${renderReviewChoices(question, selected)}
        ${question.explanation ? `<p class="review-explanation"><strong>解説</strong>${escapeHtml(question.explanation)}</p>` : ""}
        ${type === "listening" && question.script ? `<p class="review-script"><strong>Script</strong>${escapeHtml(question.script)}</p>` : ""}
      </div>
    </details>
  `;
}

function renderReviewChoices(question, selected) {
  if (!Array.isArray(question.choices) || question.choices.length === 0) return "";
  return `
    <ol class="review-choices">
      ${question.choices
        .map((choice, index) => {
          const number = index + 1;
          const classes = [number === question.correct ? "is-correct" : "", number === selected ? "is-selected" : ""].filter(Boolean).join(" ");
          return `<li class="${classes}">${escapeHtml(choice)}</li>`;
        })
        .join("")}
    </ol>
  `;
}

function renderWritingReviewItem(task) {
  const value = appState.writingAnswers[task.id] || "";
  const wordStatus = getWordStatus(task, value);
  const marked = Boolean(appState.reviews[task.id]);
  const status = value.trim() ? "入力済み" : "未入力";
  const statusClass = value.trim() ? "neutral" : "unanswered";

  return `
    <details class="review-item writing-review ${statusClass} ${marked ? "is-marked" : ""}">
      <summary>
        <span>No.${task.id}</span>
        <strong>${status}</strong>
        <small>${marked ? "見直し / " : ""}${wordStatus.count}語 / ${escapeHtml(task.targetWords || "語数指定なし")}</small>
      </summary>
      <div class="review-detail">
        <p><strong>${escapeHtml(task.label)}</strong></p>
        <p>${escapeHtml(task.lead || "")}</p>
        ${task.note ? `<p>${escapeHtml(task.note)}</p>` : ""}
        <div class="review-writing-answer">
          <strong>あなたの解答</strong>
          <p>${value.trim() ? escapeHtml(value) : "未入力です。"}</p>
        </div>
        ${renderWritingReviewChecklist(task)}
        ${
          task.modelAnswer
            ? `<div class="review-model-answer"><strong>模範解答例</strong><p>${escapeHtml(task.modelAnswer)}</p></div>`
            : ""
        }
      </div>
    </details>
  `;
}

function renderWritingReviewChecklist(task) {
  const items = getWritingCheckItems(task);
  const checkedItems = appState.writingChecks[task.id] || {};
  if (items.length === 0) return "";

  return `
    <div class="review-checklist">
      <strong>自己チェック</strong>
      <ul>
        ${items
          .map((item, index) => `<li class="${checkedItems[index] ? "checked" : ""}">${checkedItems[index] ? "✓" : "—"} ${escapeHtml(item)}</li>`)
          .join("")}
      </ul>
    </div>
  `;
}

function getReviewFilter() {
  return ["all", "wrong", "unanswered", "marked"].includes(appState.reviewFilter) ? appState.reviewFilter : "all";
}

function filterReviewQuestions(questions, answers, type, filter) {
  return questions.filter((question) => {
    const reviewId = getReviewId(question.id, type);
    const selected = answers[question.id];
    const hasCorrect = Number.isInteger(question.correct);
    const marked = Boolean(appState.reviews[reviewId]);

    if (filter === "marked") return marked;
    if (filter === "unanswered") return !selected;
    if (filter === "wrong") return Boolean(selected && hasCorrect && selected !== question.correct);
    return true;
  });
}

function filterWritingReviewTasks(tasks, filter) {
  return tasks.filter((task) => {
    const value = appState.writingAnswers[task.id] || "";
    const marked = Boolean(appState.reviews[task.id]);

    if (filter === "marked") return marked;
    if (filter === "unanswered") return !value.trim();
    if (filter === "wrong") return false;
    return true;
  });
}

function getReviewId(id, type) {
  return type === "listening" ? `l-${id}` : String(id);
}

function getChoiceText(question, number) {
  const choice = Array.isArray(question.choices) ? question.choices[number - 1] : "";
  return choice === undefined || choice === null || choice === "" ? "選択肢" : String(choice);
}

function getExamSummary() {
  const readingQuestions = getReadingQuestions();
  const listeningScoredQuestions = listeningQuestions.filter((question) => Number.isFinite(question.correct));
  const writingIds = writingTasks.map((task) => task.id);
  const reading = getChoiceScore(readingQuestions, appState.answers.written);
  const listening = getChoiceScore(listeningScoredQuestions, appState.answers.listening);
  const writingAnswered = writingIds.filter((id) => (appState.writingAnswers[id] || "").trim()).length;
  const reviewed = Object.values(appState.reviews).filter(Boolean).length;
  const total = reading.total + listening.total + writingIds.length;
  const answered = reading.answered + listening.answered + writingAnswered;

  return {
    total,
    answered,
    reviewed,
    unanswered: total - answered,
    reading,
    listening,
    writing: {
      total: writingIds.length,
      answered: writingAnswered,
      unanswered: writingIds.length - writingAnswered,
    },
  };
}

function getReadingQuestions() {
  return readingPages.flatMap((page) => page.questions);
}

function getChoiceScore(questions, answers) {
  const total = questions.length;
  const answered = questions.filter((question) => answers[question.id]).length;
  const correct = questions.filter((question) => answers[question.id] === question.correct).length;
  return {
    total,
    answered,
    correct,
    unanswered: total - answered,
  };
}

function getWrittenSummary() {
  const ids = getWrittenItemIds();
  const answered = ids.filter((id) => appState.answers.written[id] || (appState.writingAnswers[id] || "").trim()).length;
  const reviewed = ids.filter((id) => appState.reviews[id]).length;
  return {
    total: ids.length,
    answered,
    reviewed,
    unanswered: ids.length - answered,
  };
}

async function handleClick(event) {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.grade) {
    try {
      localStorage.setItem(GRADE_SELECTION_KEY, target.dataset.grade);
    } catch {
      // Continue with the reload even if local storage is unavailable.
    }
    window.location.reload();
    return;
  }

  if (target.dataset.set) {
    try {
      localStorage.setItem(getSetSelectionKey(selectedGrade), normalizeSetKey(target.dataset.set));
    } catch {
      // Continue with the reload even if local storage is unavailable.
    }
    window.location.reload();
    return;
  }

  if (target.dataset.module) {
    if (!isModuleAvailable(target.dataset.module)) return;
    appState.module = target.dataset.module;
    appState.started = false;
    appState.modal = null;
    if (appState.module === "reading") {
      appState.drawerOpen = false;
    }
    prepareModuleStart();
    saveState();
    render();
    return;
  }

  const action = target.dataset.action;
  if (!action) return;

  if (action === "start") {
    appState.started = true;
    prepareModuleStart();
  } else if (action === "restart") {
    resetState();
  } else if (action === "reset-progress") {
    resetState();
  } else if (action === "toggle-import") {
    appState.importOpen = !appState.importOpen;
    appState.importMessage = "";
  } else if (action === "fill-import-template") {
    appState.importDraft = JSON.stringify(buildImportTemplate(selectedGrade, selectedSet.key), null, 2);
    appState.importMessage = "雛形を入れました。外部AIには、このJSON構造を保ったまま本文・選択肢・正答・解説を作らせてください。";
  } else if (action === "import-questions") {
    const result = importExternalQuestionData(appState.importDraft);
    appState.importMessage = result.message;
    if (result.ok) {
      try {
        localStorage.setItem(GRADE_SELECTION_KEY, result.gradeKey);
        localStorage.setItem(getSetSelectionKey(result.gradeKey), result.setKey);
        localStorage.removeItem(`scbt-${result.gradeKey}-${result.setKey}-state`);
        if (result.setKey === "set-01") localStorage.removeItem(`scbt-${result.gradeKey}-prototype-state`);
      } catch {
        // Reloading still applies in browsers where local storage writes succeed partially.
      }
      window.location.reload();
      return;
    }
  } else if (action === "clear-imported-questions") {
    const result = clearImportedQuestionData(selectedGrade, selectedSet.key);
    appState.importMessage = result.message;
    if (result.ok) {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
      return;
    }
  } else if (action === "review-filter") {
    appState.reviewFilter = target.dataset.filter || "all";
  } else if (action === "toggle-drawer") {
    appState.drawerOpen = !appState.drawerOpen;
  } else if (action === "toggle-instruction") {
    appState.instructionOpen = !appState.instructionOpen;
  } else if (action === "show-finish" || (action === "writing-next" && appState.writingTask === writingTasks.length - 1)) {
    appState.modal = "finish";
  } else if (action === "complete-exam") {
    appState.modal = "complete";
  } else if (action === "close-modal") {
    appState.modal = null;
  } else if (action === "show-full") {
    appState.modal = appState.module === "reading" ? "full-reading" : "full";
  } else if (action === "written-answer") {
    appState.answers.written[Number(target.dataset.question)] = Number(target.dataset.value);
  } else if (action === "reading-next") {
    const page = readingPages[appState.readingPage];
    const nextIndex = getCurrentReadingItemIndex(page) + getReadingStepSize(page);
    if (nextIndex < (page?.questions?.length || 0)) {
      appState.readingItemIndex = nextIndex;
    } else if (appState.readingPage < readingPages.length - 1) {
      appState.readingPage += 1;
      appState.readingItemIndex = 0;
    } else {
      appState.module = "writing";
      appState.started = false;
    }
  } else if (action === "reading-prev") {
    const page = readingPages[appState.readingPage];
    const previousIndex = getCurrentReadingItemIndex(page) - getReadingStepSize(page);
    if (previousIndex >= 0) {
      appState.readingItemIndex = previousIndex;
    } else if (appState.readingPage > 0) {
      appState.readingPage -= 1;
      appState.readingItemIndex = getLastReadingItemIndex(readingPages[appState.readingPage]);
    }
  } else if (action === "reading-goto") {
    appState.readingPage = Number(target.dataset.page);
    appState.readingItemIndex = 0;
  } else if (action === "writing-next") {
    appState.writingTask = Math.min(writingTasks.length - 1, appState.writingTask + 1);
  } else if (action === "writing-prev") {
    appState.writingTask = Math.max(0, appState.writingTask - 1);
  } else if (action === "writing-goto") {
    appState.writingTask = Number(target.dataset.page);
  } else if (action === "jump-written") {
    jumpToWrittenItem(Number(target.dataset.question));
  } else if (action === "copy-writing") {
    const task = writingTasks[appState.writingTask];
    appState.clipboardText = appState.writingAnswers[task.id] || "";
  } else if (action === "paste-demo") {
    const task = writingTasks[appState.writingTask];
    const current = appState.writingAnswers[task.id] || "";
    const pasteText = appState.clipboardText || "I think this is a good idea because it can help many people.";
    appState.writingAnswers[task.id] = [current.trim(), pasteText].filter(Boolean).join(" ");
  } else if (action === "listen-answer") {
    const questionId = Number(target.dataset.question);
    const value = Number(target.dataset.value);
    appState.answers.listening[questionId] = value;
    saveState();
    app.querySelectorAll(`[data-action="listen-answer"][data-question="${questionId}"]`).forEach((button) => {
      button.classList.toggle("selected", Number(button.dataset.value) === value);
    });
    return;
  } else if (action === "listen-play") {
    await playListeningAudio();
    return;
  } else if (action === "listen-next") {
    if (appState.listeningIndex >= listeningQuestions.length - 1) {
      appState.modal = "complete";
    } else {
      appState.listeningIndex += 1;
      appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
    }
  } else if (action === "listen-prev") {
    appState.listeningIndex = Math.max(0, appState.listeningIndex - 1);
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (action === "listen-goto") {
    appState.listeningIndex = Number(target.dataset.page);
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (action === "speaking-record-start") {
    await startSpeakingRecording();
    return;
  } else if (action === "speaking-record-stop") {
    await stopSpeakingRecording();
    return;
  } else if (action === "speaking-record-download") {
    await downloadSpeakingRecording(Number(target.dataset.step));
    return;
  } else if (action === "speaking-record-copy") {
    await copySpeakingRecording(Number(target.dataset.step));
    return;
  } else if (action === "speaking-next") {
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingStep = Math.min(speakingSteps.length - 1, appState.speakingStep + 1);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  } else if (action === "speaking-prev") {
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingStep = Math.max(0, appState.speakingStep - 1);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  } else if (action === "speaking-goto") {
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingStep = Number(target.dataset.page);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  }

  saveState();
  render();
}

function handleChange(event) {
  const speakingCheck = event.target.dataset.speakingCheck;
  if (speakingCheck !== undefined) {
    const stepIndex = Number(event.target.dataset.speakingCheckStep);
    appState.speakingSelfChecks[stepIndex] = {
      ...(appState.speakingSelfChecks[stepIndex] || {}),
      [speakingCheck]: event.target.checked,
    };
    saveState();
    return;
  }

  const writingCheck = event.target.dataset.writingCheck;
  if (writingCheck !== undefined) {
    const taskId = Number(event.target.dataset.writingCheckTask);
    appState.writingChecks[taskId] = {
      ...(appState.writingChecks[taskId] || {}),
      [writingCheck]: event.target.checked,
    };
    saveState();
    return;
  }

  const reviewId = event.target.dataset.reviewQuestion;
  if (reviewId) {
    appState.reviews[reviewId] = event.target.checked;
    saveState();
    if (appState.module === "listening") return;
    render();
  }
}

function handleInput(event) {
  if (event.target.matches("[data-speaking-memo]")) {
    const stepIndex = Number(event.target.dataset.speakingMemo);
    appState.speakingSelfChecks[stepIndex] = {
      ...(appState.speakingSelfChecks[stepIndex] || {}),
      memo: event.target.value,
    };
    saveState();
    return;
  }

  if (event.target.matches("[data-import-draft]")) {
    appState.importDraft = event.target.value;
    appState.importMessage = "";
    saveState();
    return;
  }

  if (!event.target.matches("[data-writing-id]")) return;
  const id = Number(event.target.dataset.writingId);
  appState.writingAnswers[id] = event.target.value;
  const task = writingTasks.find((item) => item.id === id);
  const wordStatus = getWordStatus(task || {}, event.target.value);
  const counter = app.querySelector("[data-word-count]");
  if (counter) {
    counter.textContent = `${wordStatus.count}語`;
    counter.className = `word-count ${wordStatus.className}`;
  }
  const statusNode = app.querySelector("[data-word-status]");
  if (statusNode) {
    statusNode.textContent = wordStatus.label;
    statusNode.className = `word-status ${wordStatus.className}`;
  }
  saveState();
}

function jumpToWrittenItem(id) {
  const readingIndex = readingPages.findIndex((page) => page.questions.some((question) => question.id === id));
  if (readingIndex >= 0) {
    appState.module = "reading";
    appState.started = true;
    appState.readingPage = readingIndex;
    const page = readingPages[readingIndex];
    const questionIndex = Math.max(0, page.questions.findIndex((question) => question.id === id));
    const step = getReadingStepSize(page);
    appState.readingItemIndex = Math.floor(questionIndex / step) * step;
    return;
  }

  const writingIndex = writingTasks.findIndex((task) => task.id === id);
  if (writingIndex >= 0) {
    appState.module = "writing";
    appState.started = true;
    appState.writingTask = writingIndex;
  }
}

function buildImportTemplate(gradeKey, setKey = selectedSet.key) {
  const grade = gradeCatalog[gradeKey] || examData;
  const set = resolveExamSet(grade, setKey, gradeKey);
  const templateGrade = mergeGradeAndSetData(grade, set);
  return {
    grade: gradeKey,
    setKey: set.key,
    setId: set.setId,
    setLabel: set.label,
    note: "この形式を保ったまま、必要な技能だけ差し替えられます。既存の問題文・音声・画像の転載は避け、本文・選択肢・正答・解説はオリジナルで作成してください。",
    readingPages: (templateGrade.readingPages || []).map((page) => ({
      label: page.label,
      kind: page.kind,
      passageTitle: page.passageTitle || "",
      passage: page.passage || [],
      questions: (page.questions || []).map((question) => ({
        id: question.id,
        section: question.section || page.label,
        type: question.type || "",
        text: question.text || "",
        choices: question.choices || ["", "", "", ""],
        correct: question.correct || 1,
        explanation: question.explanation || "",
      })),
    })),
    listeningQuestions: (templateGrade.listeningQuestions || []).map((question) => ({
      id: question.id,
      section: question.section || "",
      instruction: question.instruction || "",
      audioFile: question.audioFile || "",
      script: question.script || "",
      questionText: question.questionText || "",
      choices: question.choices || ["", "", "", ""],
      correct: question.correct || 1,
      explanation: question.explanation || "",
    })),
    writingTasks: (templateGrade.writingTasks || []).map((task) => ({
      id: task.id,
      kind: task.kind,
      label: task.label,
      targetWords: task.targetWords,
      lead: task.lead,
      note: task.note,
      sourceTitle: task.sourceTitle,
      source: task.source || [],
      points: task.points || [],
      pointsRule: task.pointsRule || "",
      rubric: task.rubric || [],
      modelAnswer: task.modelAnswer || "",
    })),
    speakingSteps: (templateGrade.speakingSteps || []).map((step) => ({
      label: step.label,
      seconds: step.seconds || getSpeakingStepSeconds(0),
      prompt: step.prompt || "",
      visual: step.visual || "面接官",
      recording: Boolean(step.recording),
      cardTitle: step.cardTitle || "",
      cardText: step.cardText || "",
      questionText: step.questionText || "",
      pictureText: step.pictureText || "",
    })),
  };
}

function importExternalQuestionData(rawText) {
  let parsed;
  try {
    parsed = JSON.parse(rawText || "");
  } catch {
    return { ok: false, message: "JSONとして読めません。外部AIの出力がコードブロックや説明文を含んでいないか確認してください。" };
  }

  const extracted = extractImportPayload(parsed);
  if (!extracted.ok) return extracted;

  const validation = validateImportPayload(extracted.gradeKey, extracted.payload);
  if (!validation.ok) {
    return { ok: false, message: `保存しませんでした。${validation.errors.join(" / ")}` };
  }

  const normalized = normalizeImportPayload(extracted.payload);
  const imported = loadImportedGradeOverrides();
  imported[extracted.gradeKey] = {
    ...(imported[extracted.gradeKey] || {}),
    setKey: extracted.setKey,
    ...normalized,
  };
  localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(imported));
  return {
    ok: true,
    gradeKey: extracted.gradeKey,
    setKey: extracted.setKey,
    message: `${gradeCatalog[extracted.gradeKey]?.label || extracted.gradeKey}の問題データを保存しました。画面を再読み込みします。`,
  };
}

function extractImportPayload(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, message: "JSONの一番外側はオブジェクトにしてください。" };
  }

  if (parsed.grades && typeof parsed.grades === "object") {
    const gradeKey = parsed.grades[selectedGrade] ? selectedGrade : Object.keys(parsed.grades).find((key) => gradeCatalog[key]);
    if (!gradeKey) return { ok: false, message: "grades内に対応している級が見つかりません。" };
    const payload = parsed.grades[gradeKey];
    return { ok: true, gradeKey, setKey: normalizeSetKey(payload.setKey || payload.setId || selectedSet.key), payload };
  }

  const gradeKey = parsed.grade || selectedGrade;
  if (!gradeCatalog[gradeKey]) {
    return { ok: false, message: `未対応の級です: ${gradeKey}` };
  }
  return { ok: true, gradeKey, setKey: normalizeSetKey(parsed.setKey || parsed.setId || selectedSet.key), payload: parsed };
}

function validateImportPayload(gradeKey, payload) {
  const errors = [];
  if (!payload || typeof payload !== "object") {
    return { ok: false, errors: ["級データがオブジェクトではありません。"] };
  }

  const hasImportableField = ["readingPages", "listeningQuestions", "writingTasks", "speakingSteps"].some((field) => Array.isArray(payload[field]));
  if (!hasImportableField) errors.push("readingPages / listeningQuestions / writingTasks / speakingSteps のいずれかが必要です。");

  if (payload.readingPages !== undefined) errors.push(...validateReadingPages(gradeKey, payload.readingPages));
  if (payload.listeningQuestions !== undefined) errors.push(...validateListeningQuestions(gradeKey, payload.listeningQuestions));
  if (payload.writingTasks !== undefined) errors.push(...validateWritingTasks(gradeKey, payload.writingTasks));
  if (payload.speakingSteps !== undefined) errors.push(...validateSpeakingSteps(payload.speakingSteps));

  return { ok: errors.length === 0, errors };
}

function validateReadingPages(gradeKey, pages) {
  const errors = [];
  const requirement = GRADE_REQUIREMENTS[gradeKey];
  if (!Array.isArray(pages)) return ["readingPagesは配列にしてください。"];
  if (requirement && pages.length !== requirement.readingPageCounts.length) {
    errors.push(`リーディングのページ数は${requirement.readingPageCounts.length}ページにしてください。`);
  }

  const ids = [];
  pages.forEach((page, pageIndex) => {
    const questions = page.questions || [];
    const expectedCount = requirement?.readingPageCounts[pageIndex];
    if (expectedCount !== undefined && questions.length !== expectedCount) {
      errors.push(`${page.label || pageIndex + 1}は${expectedCount}問にしてください。`);
    }
    if (page.kind === "long" && normalizeTextLines(page.passage).filter(Boolean).length === 0) {
      errors.push(`${page.label || pageIndex + 1}の長文本文が空です。`);
    }
    questions.forEach((question) => {
      ids.push(Number(question.id));
      errors.push(...validateChoiceQuestion(question, `リーディングNo.${question.id}`));
    });
  });

  errors.push(...validateSequentialIds(ids, 1, requirement ? requirement.readingPageCounts.reduce((sum, count) => sum + count, 0) : ids.length, "リーディング"));
  return errors;
}

function validateListeningQuestions(gradeKey, questions) {
  const errors = [];
  const expectedCount = GRADE_REQUIREMENTS[gradeKey]?.listeningCount;
  if (!Array.isArray(questions)) return ["listeningQuestionsは配列にしてください。"];
  if (expectedCount && questions.length !== expectedCount) errors.push(`リスニングは${expectedCount}問にしてください。`);
  const ids = [];
  questions.forEach((question) => {
    ids.push(Number(question.id));
    errors.push(...validateChoiceQuestion(question, `リスニングNo.${question.id}`));
    if (!String(question.script || "").trim()) errors.push(`リスニングNo.${question.id}のスクリプトが空です。`);
    if (!String(question.questionText || "").trim()) errors.push(`リスニングNo.${question.id}の質問文が空です。`);
  });
  errors.push(...validateSequentialIds(ids, 1, expectedCount || ids.length, "リスニング"));
  return errors;
}

function validateWritingTasks(gradeKey, tasks) {
  const errors = [];
  const expectedCount = GRADE_REQUIREMENTS[gradeKey]?.writingCount;
  if (!Array.isArray(tasks)) return ["writingTasksは配列にしてください。"];
  if (expectedCount && tasks.length !== expectedCount) errors.push(`ライティングは${expectedCount}題にしてください。`);
  tasks.forEach((task) => {
    if (!Number.isInteger(Number(task.id))) errors.push("ライティングのidが不正です。");
    if (!String(task.label || "").trim()) errors.push(`ライティングNo.${task.id}のlabelが空です。`);
    if (!String(task.targetWords || "").trim()) errors.push(`ライティングNo.${task.id}の語数条件が空です。`);
    if (normalizeTextLines(task.source).filter(Boolean).length === 0) errors.push(`ライティングNo.${task.id}の問題文が空です。`);
  });
  return errors;
}

function validateSpeakingSteps(steps) {
  if (!Array.isArray(steps)) return ["speakingStepsは配列にしてください。"];
  const errors = [];
  steps.forEach((step, index) => {
    if (!String(step.label || "").trim()) errors.push(`スピーキング${index + 1}番目のlabelが空です。`);
    if (!String(step.prompt || "").trim()) errors.push(`スピーキング${index + 1}番目のpromptが空です。`);
    if (!Number.isFinite(Number(step.seconds))) errors.push(`スピーキング${index + 1}番目のsecondsが不正です。`);
  });
  return errors;
}

function validateChoiceQuestion(question, label) {
  const errors = [];
  if (!Number.isInteger(Number(question.id))) errors.push(`${label}のidが不正です。`);
  if (!String(question.text || question.questionText || "").trim()) errors.push(`${label}の問題文が空です。`);
  if (!Array.isArray(question.choices) || question.choices.length < 3) errors.push(`${label}の選択肢は3つ以上必要です。`);
  if (Array.isArray(question.choices) && question.choices.some((choice) => !String(choice || "").trim())) errors.push(`${label}の選択肢に空欄があります。`);
  const correct = Number(question.correct);
  if (!Number.isInteger(correct) || !Array.isArray(question.choices) || correct < 1 || correct > question.choices.length) {
    errors.push(`${label}の正答番号が不正です。`);
  }
  if (!String(question.explanation || "").trim()) errors.push(`${label}の解説が空です。`);
  return errors;
}

function validateSequentialIds(ids, start, end, label) {
  const errors = [];
  const sorted = ids.slice().sort((a, b) => a - b);
  const unique = new Set(sorted);
  if (unique.size !== ids.length) errors.push(`${label}に重複した問題番号があります。`);
  for (let id = start; id <= end; id += 1) {
    if (!unique.has(id)) errors.push(`${label}No.${id}がありません。`);
  }
  return errors;
}

function normalizeImportPayload(payload) {
  const normalized = {};
  if (Array.isArray(payload.readingPages)) {
    normalized.readingPages = payload.readingPages.map((page) => ({
      label: String(page.label || ""),
      kind: page.kind === "choice" ? "choice" : "long",
      instruction: String(page.instruction || ""),
      passageTitle: String(page.passageTitle || ""),
      passage: normalizeTextLines(page.passage),
      questions: (page.questions || []).map((question) => normalizeChoiceQuestion(question)),
    }));
  }
  if (Array.isArray(payload.listeningQuestions)) {
    normalized.listeningQuestions = payload.listeningQuestions.map((question) => ({
      ...normalizeChoiceQuestion(question),
      section: String(question.section || ""),
      instruction: String(question.instruction || ""),
      audioFile: String(question.audioFile || ""),
      script: String(question.script || ""),
      questionText: String(question.questionText || question.text || ""),
    }));
  }
  if (Array.isArray(payload.writingTasks)) {
    normalized.writingTasks = payload.writingTasks.map((task) => ({
      id: Number(task.id),
      kind: String(task.kind || ""),
      label: String(task.label || ""),
      targetWords: String(task.targetWords || ""),
      lead: String(task.lead || ""),
      note: String(task.note || ""),
      sourceTitle: String(task.sourceTitle || ""),
      source: normalizeTextLines(task.source),
      fixedBefore: String(task.fixedBefore || ""),
      fixedAfter: String(task.fixedAfter || ""),
      points: Array.isArray(task.points) ? task.points.map(String) : [],
      pointsRule: String(task.pointsRule || ""),
      wordRule: String(task.wordRule || "語数の目安"),
      rubric: Array.isArray(task.rubric) ? task.rubric.map(String) : [],
      modelAnswer: String(task.modelAnswer || ""),
    }));
  }
  if (Array.isArray(payload.speakingSteps)) {
    normalized.speakingSteps = payload.speakingSteps.map((step) => ({
      label: String(step.label || ""),
      seconds: Number(step.seconds),
      prompt: String(step.prompt || ""),
      visual: String(step.visual || "面接官"),
      recording: Boolean(step.recording),
      cardTitle: String(step.cardTitle || ""),
      cardText: String(step.cardText || ""),
      questionText: String(step.questionText || ""),
      pictureText: String(step.pictureText || ""),
    }));
  }
  return normalized;
}

function normalizeChoiceQuestion(question) {
  return {
    id: Number(question.id),
    section: String(question.section || ""),
    type: String(question.type || ""),
    text: String(question.text || ""),
    choices: Array.isArray(question.choices) ? question.choices.map(String) : [],
    correct: Number(question.correct),
    explanation: String(question.explanation || ""),
  };
}

function normalizeTextLines(value) {
  if (Array.isArray(value)) return value.map((line) => String(line));
  if (typeof value === "string") return value.split(/\r?\n/);
  return [];
}

function clearImportedQuestionData(gradeKey, setKey = selectedSet.key) {
  const imported = loadImportedGradeOverrides();
  if (!imported[gradeKey]) return { ok: false, message: "この級には取込データがありません。" };
  if (imported[gradeKey].setKey && normalizeSetKey(imported[gradeKey].setKey) !== normalizeSetKey(setKey)) {
    return { ok: false, message: "この回には取込データがありません。" };
  }
  delete imported[gradeKey];
  localStorage.setItem(IMPORT_STORAGE_KEY, JSON.stringify(imported));
  return { ok: true, message: "取込データを解除しました。画面を再読み込みします。" };
}

async function startSpeakingRecording() {
  const step = speakingSteps[appState.speakingStep];
  if (!step?.recording) {
    appState.speakingRecordMessage = "このステップは録音対象ではありません。";
    saveState();
    render();
    return;
  }
  if (isSpeakingRecordingActive()) return;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    appState.speakingRecordMessage = "このブラウザでは録音機能を使えません。";
    saveState();
    render();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedRecordingMimeType();
    const options = mimeType ? { mimeType } : {};
    const recorder = new MediaRecorder(stream, options);

    speakingRecorder = recorder;
    speakingRecorderStream = stream;
    speakingRecorderChunks = [];
    speakingRecorderStep = appState.speakingStep;

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) speakingRecorderChunks.push(event.data);
    });

    recorder.addEventListener("stop", () => {
      const stoppedStep = speakingRecorderStep;
      const type = recorder.mimeType || mimeType || "audio/webm";
      const blob = new Blob(speakingRecorderChunks, { type });
      cleanupSpeakingRecorder();
      saveSpeakingRecording(stoppedStep, blob, type);
    });

    recorder.start();
    appState.speakingRecordMessage = "録音中です。答え終わったら停止して保存してください。";
    saveState();
    render();
  } catch (error) {
    cleanupSpeakingRecorder();
    appState.speakingRecordMessage = "マイクを使えませんでした。ブラウザのマイク許可を確認してください。";
    saveState();
    render();
  }
}

function stopSpeakingRecording({ renderAfter = true } = {}) {
  return new Promise((resolve) => {
    if (!isSpeakingRecordingActive()) {
      resolve();
      return;
    }
    const recorder = speakingRecorder;
    const finish = () => resolve();
    recorder.addEventListener("stop", finish, { once: true });
    recorder.stop();
    if (!renderAfter) return;
  });
}

async function saveSpeakingRecording(stepIndex, blob, type) {
  if (!Number.isInteger(stepIndex) || stepIndex < 0) return;
  const fileName = buildSpeakingRecordingFileName(stepIndex, type);
  const record = {
    key: getSpeakingRecordingKey(stepIndex),
    grade: selectedGrade,
    setKey: selectedSet.key,
    stepIndex,
    fileName,
    type,
    size: blob.size,
    createdAt: new Date().toISOString(),
    blob,
  };

  if (blob.size > 0) {
    speakingRecordingUrls[stepIndex] = URL.createObjectURL(blob);
    try {
      await putSpeakingRecord(record);
    } catch {
      appState.speakingRecordMessage = "録音は一時保存しましたが、ブラウザ保存には失敗しました。";
    }
  }

  appState.speakingRecordings[stepIndex] = {
    fileName,
    type,
    size: blob.size,
    createdAt: record.createdAt,
  };
  if (!appState.speakingRecordMessage.includes("失敗")) {
    appState.speakingRecordMessage = `${fileName} を保存しました。`;
  }
  saveState();
  render();
}

async function downloadSpeakingRecording(stepIndex) {
  const blob = await getSpeakingRecordingBlob(stepIndex);
  const meta = appState.speakingRecordings[stepIndex] || {};
  if (!blob) {
    appState.speakingRecordMessage = "ダウンロードできる録音がありません。";
    saveState();
    render();
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = meta.fileName || buildSpeakingRecordingFileName(stepIndex, blob.type);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function copySpeakingRecording(stepIndex) {
  const blob = await getSpeakingRecordingBlob(stepIndex);
  const meta = appState.speakingRecordings[stepIndex] || {};
  if (!blob) {
    appState.speakingRecordMessage = "コピーできる録音がありません。";
    saveState();
    render();
    return;
  }

  try {
    if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      throw new Error("clipboard file write unavailable");
    }
    await navigator.clipboard.write([new ClipboardItem({ [blob.type || meta.type || "audio/webm"]: blob })]);
    appState.speakingRecordMessage = "録音ファイルをコピーしました。対応しているAI画面に貼り付けできます。";
  } catch {
    appState.speakingRecordMessage = "このブラウザでは音声ファイルを直接コピーできません。ダウンロードしてAI画面へアップロードしてください。";
  }
  saveState();
  render();
}

async function getSpeakingRecordingBlob(stepIndex) {
  const record = await getSpeakingRecord(stepIndex);
  return record?.blob || null;
}

function getSpeakingRecordingKey(stepIndex) {
  return `${selectedGrade}:${selectedSet.key}:${stepIndex}`;
}

function openSpeakingRecordDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const request = window.indexedDB.open("scbt-speaking-recordings", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("recordings")) {
        db.createObjectStore("recordings", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putSpeakingRecord(record) {
  const db = await openSpeakingRecordDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("recordings", "readwrite");
    transaction.objectStore("recordings").put(record);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function getSpeakingRecord(stepIndex) {
  const memoryUrl = speakingRecordingUrls[stepIndex];
  const meta = appState.speakingRecordings[stepIndex];
  if (memoryUrl && meta) {
    try {
      const response = await fetch(memoryUrl);
      const blob = await response.blob();
      return { ...meta, blob };
    } catch {
      // Fall through to IndexedDB.
    }
  }

  try {
    const db = await openSpeakingRecordDb();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("recordings", "readonly");
      const request = transaction.objectStore("recordings").get(getSpeakingRecordingKey(stepIndex));
      request.onsuccess = () => {
        db.close();
        const record = request.result || null;
        if (record?.blob && !speakingRecordingUrls[stepIndex]) {
          speakingRecordingUrls[stepIndex] = URL.createObjectURL(record.blob);
        }
        resolve(record);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch {
    return null;
  }
}

async function loadStoredSpeakingRecordings() {
  try {
    const db = await openSpeakingRecordDb();
    const records = await new Promise((resolve, reject) => {
      const transaction = db.transaction("recordings", "readonly");
      const request = transaction.objectStore("recordings").getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
    let changed = false;
    records
      .filter((record) => record.grade === selectedGrade && (record.setKey || "set-01") === selectedSet.key && record.blob)
      .forEach((record) => {
        speakingRecordingUrls[record.stepIndex] = URL.createObjectURL(record.blob);
        if (!appState.speakingRecordings[record.stepIndex]) {
          appState.speakingRecordings[record.stepIndex] = {
            fileName: record.fileName,
            type: record.type,
            size: record.size,
            createdAt: record.createdAt,
          };
          changed = true;
        }
      });
    if (changed) saveState();
    if (records.length > 0) render();
  } catch {
    // Recording persistence is optional; the speaking screen still works without it.
  }
}

function cleanupSpeakingRecorder() {
  if (speakingRecorderStream) {
    speakingRecorderStream.getTracks().forEach((track) => track.stop());
  }
  speakingRecorder = null;
  speakingRecorderStream = null;
  speakingRecorderChunks = [];
  speakingRecorderStep = null;
}

function isSpeakingRecordingActive(stepIndex = null) {
  const active = speakingRecorder?.state === "recording";
  if (stepIndex === null) return active;
  return active && speakingRecorderStep === stepIndex;
}

function getSupportedRecordingMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return ["audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg"].find((type) =>
    MediaRecorder.isTypeSupported(type),
  ) || "";
}

function getRecordingFormatLabel(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("mp4")) return "保存形式: MP4";
  if (normalized.includes("webm")) return "保存形式: WebM（MP4非対応時）";
  if (normalized.includes("ogg")) return "保存形式: OGG（MP4非対応時）";
  return "保存形式: ブラウザ標準";
}

function buildSpeakingRecordingFileName(stepIndex, type) {
  const extension = getRecordingExtension(type);
  const stepNumber = String(Number(stepIndex) + 1).padStart(2, "0");
  return `${selectedGrade}-${selectedSet.key}-speaking-step-${stepNumber}.${extension}`;
}

function getRecordingExtension(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized.includes("mp4")) return "mp4";
  if (normalized.includes("ogg")) return "ogg";
  return "webm";
}

function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getWritingCheckItems(task) {
  const rubric = Array.isArray(task.rubric) ? task.rubric.filter(Boolean) : [];
  if (rubric.length > 0) return rubric;
  return ["問題の指示に答えている", "理由や要点が不足していない", "語数条件を確認した", "文法・つづりを見直した"];
}

function getWordTarget(task) {
  const numbers = String(task.targetWords || "").match(/\d+/g)?.map(Number) || [];
  if (numbers.length >= 2) return { min: numbers[0], max: numbers[1] };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return null;
}

function getWordStatus(task, value) {
  const count = countWords(value || "");
  const target = getWordTarget(task || {});
  if (!target) return { count, className: "neutral", label: "語数を確認" };
  if (count < target.min) return { count, className: "under", label: `${target.min - count}語不足` };
  if (count > target.max) return { count, className: "over", label: `${count - target.max}語超過` };
  return { count, className: "ok", label: "語数範囲内" };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSpeakingStepSeconds(index) {
  const step = speakingSteps[index] || speakingSteps[0] || {};
  if (Number.isFinite(step.seconds)) return step.seconds;
  if (typeof step.time === "string") {
    const match = step.time.match(/(\d+)\s*:\s*(\d+)/);
    if (match) return Number(match[1]) * 60 + Number(match[2]);
  }
  return 10;
}

function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function loadState() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY) || (selectedSet.key === "set-01" ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);
    const saved = JSON.parse(savedText || "null");
    if (!saved || typeof saved !== "object") return normalizeState(applyRequestStateOverrides(structuredClone(defaultState)));
    return normalizeState(applyRequestStateOverrides({
      ...structuredClone(defaultState),
      ...saved,
      answers: {
        ...structuredClone(defaultState).answers,
        ...(saved.answers || {}),
      },
      modal: null,
    }));
  } catch {
    return normalizeState(applyRequestStateOverrides(structuredClone(defaultState)));
  }
}

function applyRequestStateOverrides(state) {
  const requestedModule = requestParams.get("module");
  if (requestedModule && isModuleAvailable(requestedModule)) {
    state.module = requestedModule;
  }

  const requestedStart = requestParams.get("start") || requestParams.get("started");
  if (requestedStart === "1") state.started = true;
  if (requestedStart === "0") state.started = false;

  const requestedQuestion = Number(requestParams.get("question") || requestParams.get("listen") || "");
  if (state.module === "listening" && Number.isFinite(requestedQuestion)) {
    const questionIndex = listeningQuestions.findIndex((question) => Number(question.id) === requestedQuestion);
    if (questionIndex >= 0) state.listeningIndex = questionIndex;
  }

  return state;
}

function normalizeState(state) {
  if (!isModuleAvailable(state.module)) {
    state.module = defaultModule;
    state.started = false;
  }
  state.readingPage = Math.min(Math.max(Number(state.readingPage) || 0, 0), readingPages.length - 1);
  state.readingItemIndex = Math.min(Math.max(Number(state.readingItemIndex) || 0, 0), getLastReadingItemIndex(readingPages[state.readingPage]));
  state.writingTask = Math.min(Math.max(Number(state.writingTask) || 0, 0), writingTasks.length - 1);
  state.listeningIndex = Math.min(Math.max(Number(state.listeningIndex) || 0, 0), listeningQuestions.length - 1);
  state.speakingStep = Math.min(Math.max(Number(state.speakingStep) || 0, 0), speakingSteps.length - 1);
  state.writtenRemaining = clampSeconds(state.writtenRemaining, WRITTEN_EXAM_SECONDS);
  state.listeningAnswerRemaining = clampSeconds(state.listeningAnswerRemaining, LISTENING_ANSWER_SECONDS);
  state.speakingRemaining = clampSeconds(state.speakingRemaining, getSpeakingStepSeconds(state.speakingStep));
  if (!state.writingChecks || typeof state.writingChecks !== "object") state.writingChecks = {};
  if (!state.speakingRecordings || typeof state.speakingRecordings !== "object") state.speakingRecordings = {};
  if (!state.speakingSelfChecks || typeof state.speakingSelfChecks !== "object") state.speakingSelfChecks = {};
  if (typeof state.speakingRecordMessage !== "string") state.speakingRecordMessage = "";
  if (!["all", "wrong", "unanswered", "marked"].includes(state.reviewFilter)) state.reviewFilter = "all";
  return state;
}

function clampSeconds(value, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return max;
  return Math.min(Math.max(number, 0), max);
}

function saveState() {
  const stateToSave = {
    ...appState,
    modal: null,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
}

function resetState() {
  const fresh = structuredClone(defaultState);
  Object.keys(appState).forEach((key) => delete appState[key]);
  Object.assign(appState, fresh);
  localStorage.removeItem(STORAGE_KEY);
  if (selectedSet.key === "set-01") localStorage.removeItem(LEGACY_STORAGE_KEY);
}

function prepareModuleStart() {
  if (appState.module === "reading") {
    appState.readingPage = 0;
    appState.readingItemIndex = 0;
    appState.drawerOpen = false;
  }
  if (appState.module === "listening") {
    stopListeningPlayback();
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  }
  if (appState.module === "speaking") {
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  }
}

function tickTimers() {
  if (!appState.started || appState.modal) return;

  if (appState.module === "reading" || appState.module === "writing") {
    if (appState.writtenRemaining > 0) {
      appState.writtenRemaining -= 1;
      updateTimerText("[data-written-timer]", formatClock(appState.writtenRemaining));
      saveState();
    }
    return;
  }

  if (appState.module === "listening") {
    const question = listeningQuestions[appState.listeningIndex];
    if (question?.audioFile && (listeningPlaybackQuestionId !== question.id || listeningPlaybackPhase !== "answer")) {
      return;
    }
    if (appState.listeningAnswerRemaining > 0) {
      appState.listeningAnswerRemaining -= 1;
      updateTimerText("[data-listening-timer]", appState.listeningAnswerRemaining);
      const timerBar = app.querySelector("[data-listening-answer-bar]");
      if (timerBar) {
        const percent = Math.max(0, Math.min(100, (appState.listeningAnswerRemaining / LISTENING_ANSWER_SECONDS) * 100));
        timerBar.style.width = `${percent}%`;
      }
      saveState();
    } else if (appState.listeningIndex < listeningQuestions.length - 1) {
      appState.listeningIndex += 1;
      appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
      saveState();
      render();
    }
    return;
  }

  if (appState.module === "speaking") {
    if (appState.speakingRemaining > 0) {
      appState.speakingRemaining -= 1;
      updateTimerText("[data-speaking-timer]", formatClock(appState.speakingRemaining));
      saveState();
    } else if (appState.speakingStep < speakingSteps.length - 1) {
      if (isSpeakingRecordingActive()) stopSpeakingRecording({ renderAfter: false });
      appState.speakingStep += 1;
      appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
      saveState();
      render();
    }
  }
}

function updateTimerText(selector, value) {
  const node = app.querySelector(selector);
  if (node) node.textContent = value;
}

render();
loadStoredSpeakingRecordings();
setInterval(tickTimers, 1000);
