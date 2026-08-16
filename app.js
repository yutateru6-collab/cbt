const appConfig = window.APP_CONFIG || {};
const storageNamespace = appConfig.storageNamespace || "scbt";
const IMPORT_STORAGE_KEY = `${storageNamespace}-external-exam-overrides`;
const LEGACY_IMPORT_STORAGE_KEY = "scbt-external-exam-overrides";
const examCatalog = window.examData || {};
const importedGradeOverrides = loadImportedGradeOverrides();
const fullGradeCatalog = examCatalog.grades || { pre2: examCatalog };
const baseGradeCatalog = appConfig.grade && fullGradeCatalog[appConfig.grade]
  ? { [appConfig.grade]: fullGradeCatalog[appConfig.grade] }
  : fullGradeCatalog;
const gradeCatalog = applyImportedGradeOverrides(baseGradeCatalog, importedGradeOverrides);
const GRADE_SELECTION_KEY = `${storageNamespace}-selected-grade`;
const SET_SELECTION_KEY_PREFIX = `${storageNamespace}-selected-set`;
const requestParams = new URLSearchParams(window.location.search);
const isGrade2Product = appConfig.mode === "grade2-product" && appConfig.grade === "grade2";
const grade2Scoring = window.Grade2Scoring || null;
const isGrade2DeveloperMode = isGrade2Product && requestParams.get("dev") === "1";
document.body.classList.toggle("grade2-developer-mode", isGrade2DeveloperMode);
const ACCESS_PLANS = Object.freeze({
  sample: Object.freeze({
    key: "sample",
    label: "無料サンプル",
    setKeys: ["sample"],
    allowsExplanations: false,
    allowsBonus: false,
  }),
  single: Object.freeze({
    key: "single",
    label: "1回版",
    setKeys: ["set-01"],
    allowsExplanations: false,
    allowsBonus: false,
  }),
  three: Object.freeze({
    key: "three",
    label: "3回プレミアム",
    setKeys: ["set-01", "set-02", "set-03"],
    allowsExplanations: true,
    allowsBonus: true,
  }),
  five: Object.freeze({
    key: "five",
    label: "5回プレミアム",
    setKeys: ["set-01", "set-02", "set-03", "set-04", "set-05"],
    allowsExplanations: true,
    allowsBonus: true,
  }),
});
const selectedAccessPlan = resolveAccessPlan();
const canViewExplanations = selectedAccessPlan.allowsExplanations;
const canViewBonus = selectedAccessPlan.allowsBonus;
const previewHostname = window.location.hostname;
const isPrivateLanPreviewHost =
  /^10\./.test(previewHostname) ||
  /^192\.168\./.test(previewHostname) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(previewHostname);
const isLocalPreviewHost =
  ["127.0.0.1", "localhost", "::1", "[::1]"].includes(previewHostname) || isPrivateLanPreviewHost;
const requestedLockedGrade = appConfig.grade || window.APP_GRADE || examCatalog.appGrade || "";
const availableGradeKeys = (examCatalog.gradeOrder || Object.keys(gradeCatalog)).filter((key) => gradeCatalog[key]);
const fallbackGradeKey = availableGradeKeys[0] || "pre2";
const isGradeLocked = Boolean(requestedLockedGrade && gradeCatalog[requestedLockedGrade]);
const allowDataImport = appConfig.allowDataImport !== false;
const selectedGrade = resolveSelectedGrade();
const selectedSetKey = resolveSelectedSet(selectedGrade);
const selectedGradeData = gradeCatalog[selectedGrade] || gradeCatalog[fallbackGradeKey] || {};
const selectedSet = resolveExamSet(selectedGradeData, selectedSetKey, selectedGrade);
const mergedExamData = mergeGradeAndSetData(selectedGradeData, selectedSet);
const isGrade2SampleExperience = isGrade2Product && selectedAccessPlan.key === "sample";
const examData = isGrade2SampleExperience ? buildGrade2SampleExamData(mergedExamData) : mergedExamData;
const selectedGradeLabel = examData.label || selectedGrade;
const selectedGradeDisplay = examData.displayName || selectedGradeLabel;
const selectedSetLabel = examData.setLabel || selectedSet.label || selectedSetKey;
const selectedSetImported = isImportedSet(selectedGrade, selectedSet.key);
const selectedGradeImported = selectedSetImported;
const isGrade2SpeakingExperience = isGrade2Product && selectedGrade === "grade2";
const isGrade2ContinuousExam = isGrade2SpeakingExperience;
const GRADE2_SPEAKING_AUDIO_BASE =
  "https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/20260815-gemini-speaking-kore-v5";
const GRADE2_LISTENING_INSTRUCTION_AUDIO = Object.freeze({
  part1: `${GRADE2_SPEAKING_AUDIO_BASE}/instructions/listening-part1-ja.wav`,
  part2: `${GRADE2_SPEAKING_AUDIO_BASE}/instructions/listening-part2-ja.wav`,
});
// Measured from the currently selected listening masters. These gains only
// attenuate louder items, so they cannot introduce clipping or alter timing.
const GRADE2_LISTENING_AUDIO_GAINS = Object.freeze({
  "set-01": [0.7612, 0.7612, 0.7638, 0.7603, 0.9141, 0.7691, 0.7691, 0.8138, 0.7586, 0.7577, 0.7621, 0.864, 0.7586, 0.7577, 0.8882, 0.7762, 0.763, 0.7798, 0.778, 0.8072, 0.7754, 0.7682, 0.7691, 0.7736, 0.7736, 1, 0.7665, 0.7789, 0.7709, 0.7682],
  "set-02": [0.9386, 0.943, 0.9343, 0.9333, 0.9408, 0.9365, 0.929, 0.9638, 0.9354, 1, 0.9886, 0.93, 0.9322, 0.9408, 0.9716, 0.9397, 0.9419, 0.9583, 0.9397, 0.9539, 0.9397, 0.955, 0.9473, 0.9528, 0.9572, 0.9616, 0.9561, 0.9484, 0.93, 0.943],
  "set-03": [0.8511, 0.8511, 0.8414, 0.8913, 0.871, 0.861, 0.881, 0.861, 0.8913, 0.861, 0.861, 0.8318, 0.881, 0.871, 0.871, 0.912, 0.8318, 0.8414, 0.861, 0.9441, 0.881, 0.7852, 0.8222, 0.9016, 0.8913, 1, 0.8913, 0.912, 0.9772, 0.9333],
});
const GRADE2_GRADING_GPT_URL = String(appConfig.gradingGptUrl || appConfig.speakingFeedbackGptUrl || "").trim();
const GRADE2_EXTERNAL_AI_GRADING_URL = "./bonus.html?plan=three#ai-grading";
const FONT_LEVEL_MAX = 6;

const appTitle = appConfig.title || `${selectedGradeLabel}CBT形式4技能トレーニング`;
document.title = appTitle;

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
    const savedText = localStorage.getItem(IMPORT_STORAGE_KEY) || (!appConfig.grade && IMPORT_STORAGE_KEY !== LEGACY_IMPORT_STORAGE_KEY ? localStorage.getItem(LEGACY_IMPORT_STORAGE_KEY) : null);
    const saved = JSON.parse(savedText || "{}");
    if (!saved || typeof saved !== "object") return {};
    if (appConfig.grade) {
      return saved[appConfig.grade] ? { [appConfig.grade]: saved[appConfig.grade] } : {};
    }
    return saved;
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
  if (appConfig.grade) return SET_SELECTION_KEY_PREFIX;
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
  const enabledSets = getAccessibleExamSets(grade, gradeKey);
  const fallbackSet = enabledSets[0] || { key: "set-01" };
  const defaultSetKey = normalizeSetKey(grade.defaultSet || fallbackSet.key);
  const requestedSet = requestParams.get("set") || requestParams.get("setKey");
  if (requestedSet) {
    const requestedSetKey = normalizeSetKey(requestedSet);
    if (enabledSets.some((set) => set.key === requestedSetKey)) return requestedSetKey;
  }
  try {
    const selectionKeys = [getSetSelectionKey(gradeKey), `scbt-selected-set-${gradeKey}`];
    for (const key of [...new Set(selectionKeys)]) {
      const savedSet = normalizeSetKey(localStorage.getItem(key));
      if (enabledSets.some((set) => set.key === savedSet)) return savedSet;
    }
  } catch {
    // Local storage can be unavailable in some preview modes.
  }
  if (enabledSets.some((set) => set.key === defaultSetKey)) return defaultSetKey;
  return fallbackSet.key;
}

function resolveExamSet(grade, setKey, gradeKey) {
  const sets = getAccessibleExamSets(grade, gradeKey);
  return sets.find((set) => set.key === setKey) || sets[0] || makeLegacySet(grade, gradeKey);
}

function resolveAccessPlan() {
  const requestedPlan = String(requestParams.get("plan") || "").trim().toLowerCase();
  if (isGrade2Product && requestedPlan === "five") return ACCESS_PLANS.three;
  return ACCESS_PLANS[requestedPlan] || ACCESS_PLANS.single;
}

function isSetIncludedInAccessPlan(set) {
  return selectedAccessPlan.setKeys.includes(normalizeSetKey(set?.key));
}

function getAccessibleExamSets(grade, gradeKey) {
  const enabledSets = getGradeSets(grade, gradeKey).filter((set) => set.enabled);
  if (!appConfig.grade) return enabledSets;
  const includedSets = enabledSets.filter((set) => isSetIncludedInAccessPlan(set));
  if (includedSets.length > 0) return includedSets;
  return enabledSets;
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

function buildGrade2SampleExamData(source) {
  const sourceReadingPages = Array.isArray(source?.readingPages) ? source.readingPages : [];
  const firstReadingPage = sourceReadingPages[0]
    ? { ...sourceReadingPages[0], questions: (sourceReadingPages[0].questions || []).slice(0, 2) }
    : null;
  const nextReadingPage = sourceReadingPages
    .slice(1)
    .find((page) => Array.isArray(page?.questions) && page.questions.length > 0);
  const readingPages = [
    firstReadingPage,
    nextReadingPage ? { ...nextReadingPage, questions: nextReadingPage.questions.slice(0, 1) } : null,
  ].filter(Boolean);
  const listeningQuestions = (source?.listeningQuestions || []).filter((question) =>
    [1, 2, 16, 17].includes(Number(question.id)),
  );

  return {
    ...source,
    readingPages,
    listeningQuestions,
    writingTasks: (source?.writingTasks || []).slice(0, 1),
    writtenExamSeconds: 12 * 60,
    sampleMode: true,
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

const baseSpeakingSteps = examData.speakingSteps || [
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

const speakingSteps = isGrade2SpeakingExperience ? buildGrade2SpeakingFlow(baseSpeakingSteps) : baseSpeakingSteps;

function getGrade2SpeakingAudioUrl(scope, audioId) {
  return `${GRADE2_SPEAKING_AUDIO_BASE}/${scope}/${audioId}.wav`;
}

function buildGrade2SpeakingFlow(sourceSteps) {
  const byLabel = (label) => sourceSteps.find((step) => String(step.label || "").toLowerCase() === label.toLowerCase()) || {};
  const warmup = byLabel("Warm-up");
  const silentReading = byLabel("Silent Reading");
  const readAloud = byLabel("Read Aloud");
  const no1 = byLabel("No.1");
  const no2 = byLabel("No.2");
  const no3 = byLabel("No.3");
  const no4 = byLabel("No.4");
  const cardTitle = silentReading.cardTitle || readAloud.cardTitle || "Using Refill Stations";
  const cardText =
    silentReading.cardText ||
    readAloud.cardText ||
    "Some stores now have refill stations for soap, shampoo, and other daily products. Customers bring empty bottles and fill them again instead of buying new plastic containers. These stations can reduce waste and help people think about how they shop. However, stores must keep the machines clean and make the prices easy to understand.";
  const defaultPictureStory = {
    cardTitle,
    cardText,
    imageSrc: "assets/grade2-speaking-picture-story-02-anime.png",
    imageAlt: "Three-panel picture story for speaking practice.",
    openingSentence: "One day, Maya and her father went to a supermarket that had a refill station.",
    firstSpeech: "Let's refill this bottle instead of buying a new one.",
    firstSpeechSpeaker: "Maya's father",
    firstSpeechTail: "center",
    firstTimeLabel: "A few minutes later",
    secondTimeLabel: "That evening at home",
  };
  const pictureStory = {
    ...defaultPictureStory,
    ...(no2.pictureStory || {}),
    cardTitle,
    cardText,
  };

  const fullFlow = [
    {
      id: "preflight",
      phase: "setup",
      stage: "受験前チェック 1/5",
      label: "スピーキング受験前の確認",
      prompt: "音声とマイクを確認してから、2級スピーキングを開始します。",
      visual: "setup",
      recording: false,
      seconds: 0,
    },
    {
      id: "output-check",
      phase: "output-check",
      stage: "受験前チェック 2/5",
      label: "音量の確認",
      prompt: "確認音声を再生し、聞き取りやすい音量へ調整してください。",
      visual: "setup",
      recording: false,
      seconds: 0,
    },
    {
      id: "microphone-check",
      phase: "microphone-check",
      stage: "受験前チェック 3/5",
      label: "マイク入力の確認",
      prompt: "マイクを許可し、普段どおりの声で話してください。",
      visual: "setup",
      recording: false,
      seconds: 0,
    },
    {
      id: "test-recording",
      phase: "test-recording",
      stage: "受験前チェック 4/5",
      label: "5秒間のテスト録音",
      prompt: "My name is ... など、短い英語をマイクに向かって話してください。",
      visual: "setup",
      recording: true,
      seconds: 5,
    },
    {
      id: "test-playback",
      phase: "test-playback",
      stage: "受験前チェック 5/5",
      label: "録音の再生確認",
      prompt: "録音を再生し、声が十分に聞こえることを確認してください。",
      visual: "setup",
      recording: false,
      seconds: 0,
    },
    {
      id: "section-start",
      phase: "section-start",
      stage: "スピーキング開始",
      label: "2級スピーキング",
      prompt: "準備ができました。ここから先は本番形式で自動的に進みます。",
      visual: "examiner",
      recording: false,
      seconds: 0,
    },
    {
      id: "grade-introduction",
      phase: "prompt-only",
      stage: "スピーキング開始案内",
      label: "試験の進め方",
      prompt: "テスト構成、録音、聞き直し、端末保存について日本語で案内します。",
      promptSpeech:
        "これから2級スピーキングテストを始めます。はじめに、採点対象外のウォームアップを行います。そのあと、問題カードの黙読、音読、ナンバー1からナンバー4へ進みます。案内や質問の音声が終わってから、マイクに向かって答えてください。質問は2回まで聞き直せます。録音はこの端末内に保存され、テスト終了後にダウンロードできます。",
      promptAudioFile: getGrade2SpeakingAudioUrl("instructions", "speaking-start-ja"),
      visual: "examiner",
      recording: false,
      seconds: 0,
      autoStart: true,
    },
    {
      id: "warmup-introduction",
      phase: "prompt-only",
      stage: "Warm-up",
      label: "Warm-up Instructions",
      prompt: "2問とも採点対象外です。質問を聞き、英語で答えてください。",
      promptSpeech:
        "We will begin with two warm-up questions. These questions are not scored. Please answer each question in English.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "warmup-intro"),
      visual: "examiner",
      recording: false,
      seconds: 0,
      autoStart: true,
    },
    {
      id: "warmup-1",
      phase: "question",
      stage: "Warm-up 1",
      label: "Warm-up 1",
      prompt: "質問を聞いて英語で答えてください。ウォームアップは採点対象外です。",
      promptSpeech: warmup.questionText || "What do you usually do after school?",
      promptAudioFile: getGrade2SpeakingAudioUrl(selectedSet.key, "warmup-1"),
      visual: "examiner",
      recording: true,
      seconds: 10,
      autoStart: true,
      replayLimit: 2,
      practiceOnly: true,
      modelAnswer: warmup.modelAnswer || "",
      explanation: warmup.explanation || "",
      explanationTier: warmup.explanationTier || "",
    },
    {
      id: "warmup-2",
      phase: "question",
      stage: "Warm-up 2",
      label: "Warm-up 2",
      prompt: "もう一つ短い質問に答えてください。ウォームアップは採点対象外です。",
      promptSpeech: "What do you enjoy doing on weekends?",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "warmup-2"),
      visual: "examiner",
      recording: true,
      seconds: 10,
      autoStart: true,
      replayLimit: 2,
      practiceOnly: true,
      modelAnswer: "I enjoy playing sports and watching movies on weekends.",
      explanation: `【答え方】週末に楽しんでいることを一つ直接答えます。I enjoy ...ing または I like to ... を使うと自然です。
【解答例】I enjoy playing sports and watching movies on weekends.
【評価上の位置づけ】ウォームアップは採点対象外です。短くても質問に合う一文を、面接官に届く声量で答えれば十分です。`,
      explanationTier: "premium",
    },
    {
      id: "card-introduction",
      phase: "prompt-only",
      stage: "問題カード",
      label: "Card Instructions",
      prompt: "ここから採点対象の問題です。問題カードを見てください。",
      promptSpeech: "Now, we will begin the test. Please look at the card.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "card-introduction"),
      visual: "card",
      cardTitle,
      cardText,
      recording: false,
      seconds: 0,
      autoStart: true,
    },
    {
      id: "silent-reading",
      phase: "silent-reading",
      stage: "問題カード",
      label: "Silent Reading",
      prompt: "次のパッセージを20秒間で黙読してください。",
      promptSpeech: "Please read the passage silently for twenty seconds.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "silent-reading"),
      visual: "card",
      cardTitle,
      cardText,
      recording: false,
      seconds: Number(silentReading.seconds) || 20,
      autoStart: true,
      timed: true,
    },
    {
      id: "read-aloud",
      phase: "read-aloud",
      stage: "音読",
      label: "Read Aloud",
      prompt: "合図のあと、パッセージを声に出して読んでください。",
      promptSpeech: "Now, please read the passage aloud.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "read-aloud"),
      visual: "card",
      cardTitle,
      cardText,
      recording: true,
      seconds: Number(readAloud.seconds) || 45,
      autoStart: true,
      explanation: readAloud.explanation || "",
      explanationTier: readAloud.explanationTier || "",
    },
    {
      id: "no-1",
      phase: "question",
      stage: "No. 1",
      label: "No. 1",
      prompt: "パッセージについての質問を聞いて答えてください。",
      promptSpeech: no1.questionText || "According to the passage, how can refill stations reduce waste?",
      promptAudioFile: getGrade2SpeakingAudioUrl(selectedSet.key, "no-1"),
      questionText: no1.questionText || "According to the passage, how can refill stations reduce waste?",
      visual: "card",
      cardTitle,
      cardText,
      recording: true,
      seconds: Number(no1.seconds) || 30,
      autoStart: true,
      replayLimit: 2,
      modelAnswer: no1.modelAnswer || "",
      explanation: no1.explanation || "",
      explanationTier: no1.explanationTier || "",
    },
    {
      id: "no-2-preparation",
      phase: "picture-preparation",
      stage: "No. 2 準備",
      label: "20秒の考慮時間",
      prompt: "3コマの展開を確認し、説明する内容を20秒間で考えてください。",
      promptSpeech: "Now, please look at the picture and describe the situation. You have twenty seconds to prepare. Your story should begin with the sentence on the card.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "no-2-preparation"),
      visual: "picture",
      pictureStory,
      recording: false,
      seconds: 20,
      autoStart: true,
      timed: true,
    },
    {
      id: "no-2",
      phase: "question",
      stage: "No. 2",
      label: "No. 2",
      prompt: "合図のあと、3コマの展開を英語で説明してください。",
      promptSpeech: "Please begin.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "no-2"),
      visual: "picture",
      pictureStory,
      recording: true,
      seconds: 60,
      autoStart: true,
      replayLimit: 2,
      modelAnswer: no2.modelAnswer || "",
      explanation: no2.explanation || "",
      explanationTier: no2.explanationTier || "",
    },
    {
      id: "turn-card",
      phase: "turn-card",
      stage: "カード終了",
      label: "カードを閉じます",
      prompt: "ここから先の質問では、問題カードは表示されません。",
      promptSpeech: "Please turn over the card and put it down.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "turn-card"),
      visual: "examiner",
      recording: false,
      seconds: 3,
      autoStart: true,
      timed: true,
    },
    {
      id: "no-3",
      phase: "question",
      stage: "No. 3",
      label: "No. 3",
      prompt: "質問を聞き、自分の意見と理由を英語で答えてください。",
      promptSpeech: `Now, No. 3. ${no3.questionText || "Some people say that more stores should reduce packaging. What do you think about that?"}`,
      promptAudioFile: getGrade2SpeakingAudioUrl(selectedSet.key, "no-3"),
      questionText: no3.questionText || "Some people say that more stores should reduce packaging. What do you think about that?",
      visual: "examiner",
      recording: true,
      seconds: 35,
      autoStart: true,
      replayLimit: 2,
      modelAnswer: no3.modelAnswer || "",
      explanation: no3.explanation || "",
      explanationTier: no3.explanationTier || "",
    },
    {
      id: "no-4",
      phase: "choice-question",
      stage: "No. 4",
      label: "No. 4",
      prompt: "質問を聞き、YesまたはNoを選んでから理由を英語で答えてください。",
      promptSpeech: `Now, No. 4. ${no4.questionText || "Do you think students should learn more practical skills at school?"}`,
      promptAudioFile: getGrade2SpeakingAudioUrl(selectedSet.key, "no-4"),
      questionText: no4.questionText || "Do you think students should learn more practical skills at school?",
      visual: "examiner",
      recording: true,
      seconds: 35,
      autoStart: true,
      replayLimit: 2,
      requiresChoice: true,
      modelAnswer: no4.modelAnswer || "",
      explanation: no4.explanation || "",
      explanationTier: no4.explanationTier || "",
    },
    {
      id: "section-finish",
      phase: "prompt-only",
      stage: "スピーキング終了",
      label: "End of Speaking Test",
      prompt: "終了案内の音声が流れます。",
      promptSpeech: "This is the end of the speaking test.",
      promptAudioFile: getGrade2SpeakingAudioUrl("common", "section-finish"),
      visual: "examiner",
      recording: false,
      seconds: 0,
      autoStart: true,
    },
    {
      id: "review",
      phase: "review",
      stage: "スピーキング終了",
      label: "録音を確認する",
      prompt: "スピーキングは終了です。録音はこの端末内に保存されています。",
      visual: "review",
      recording: false,
      seconds: 0,
    },
  ];

  if (!isGrade2SampleExperience) return fullFlow;
  const sampleStepIds = new Set([
    "preflight",
    "output-check",
    "microphone-check",
    "section-start",
    "grade-introduction",
    "warmup-introduction",
    "warmup-1",
    "card-introduction",
    "silent-reading",
    "read-aloud",
    "no-1",
    "no-2-preparation",
    "no-2",
    "turn-card",
    "no-3",
    "no-4",
    "section-finish",
    "review",
  ]);
  const sampleSeconds = {
    "silent-reading": 10,
    "read-aloud": 20,
    "no-1": 15,
    "no-2-preparation": 10,
    "no-2": 30,
    "no-3": 20,
    "no-4": 20,
  };
  return fullFlow
    .filter((step) => sampleStepIds.has(step.id))
    .map((step) => ({ ...step, seconds: sampleSeconds[step.id] ?? step.seconds }));
}

const availableModuleKeys = new Set(Object.keys(modules).filter(isModuleAvailable));
const defaultModule = isGrade2ContinuousExam && availableModuleKeys.has("speaking")
  ? "speaking"
  : availableModuleKeys.has("reading")
    ? "reading"
    : availableModuleKeys.values().next().value || "reading";

const WRITTEN_EXAM_SECONDS = examData.writtenExamSeconds || 80 * 60;
const LISTENING_ANSWER_SECONDS = examData.listeningAnswerSeconds || 10;
const STORAGE_KEY = isGradeLocked
  ? `${storageNamespace}-${selectedSet.key}-state`
  : `${storageNamespace}-${selectedGrade}-${selectedSet.key}-state`;
const LEGACY_STORAGE_KEYS = [
  `scbt-${selectedGrade}-${selectedSet.key}-state`,
  ...(selectedSet.key === "set-01" ? [`scbt-${selectedGrade}-prototype-state`] : []),
].filter((key) => key !== STORAGE_KEY);

const defaultState = {
  module: defaultModule,
  started: false,
  drawerOpen: false,
  fontLevel: 1,
  readingPage: 0,
  readingItemIndex: 0,
  writingTask: 0,
  listeningIndex: 0,
  speakingStep: 0,
  writtenRemaining: WRITTEN_EXAM_SECONDS,
  listeningAnswerRemaining: LISTENING_ANSWER_SECONDS,
  listeningIntroducedSections: {},
  listeningPlayedQuestionIds: {},
  listeningReviewMode: false,
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
  speakingPhaseStatus: "idle",
  speakingOutputVolume: 70,
  speakingReplayCounts: {},
  speakingChoices: {},
  speakingBreakOpen: false,
  speakingMicReady: false,
  speakingMicMessage: "",
  speakingTestConfirmed: false,
  scored: false,
  grade2GptScoreDraft: "",
  grade2GptScoreMessage: "",
  grade2GptScores: null,
  reviewFilter: "all",
  importOpen: false,
  importDraft: "",
  importMessage: "",
  instructionOpen: false,
  modal: null,
};

const appState = loadState();
let blockedWritingEdit = null;
normalizeGrade2RequestUrl();
const speakingRecordingUrls = {};
const GRADE2_SPEAKING_OUTPUT_VOICE_PREFERENCES = [
  "Microsoft AvaMultilingual",
  "Microsoft Ava",
  "en-US-AvaMultilingual",
  "en-US Ava",
  "Ava",
  "Microsoft EmmaMultilingual",
  "Microsoft Emma",
  "Emma",
  "Microsoft Jenny",
  "Microsoft Aria",
];
const GRADE2_SPEAKING_MIC_LEVEL_GAIN = 520;
let speakingRecorder = null;
let speakingRecorderStream = null;
let speakingRecorderChunks = [];
let speakingRecorderStep = null;
let speakingRecordingSavePromise = Promise.resolve();
let speakingRecorderRenderAfterStop = true;
let speakingMicCheckStream = null;
let speakingAudioContext = null;
let speakingAnalyser = null;
let speakingMeterFrame = null;
let grade2SpeakingDeadline = 0;
let grade2SpeakingAdvanceInProgress = false;
let grade2SpeakingActivationToken = 0;
let listeningAudioElement = null;
let listeningInstructionAudioElement = null;
let listeningSpeechUtterance = null;
let listeningPlaybackQuestionId = null;
let listeningPlaybackPhase = "idle";
let listeningAnswerDeadline = 0;
let listeningPlaybackStarts = 0;

const app = document.getElementById("app");
document.title = appTitle;
app.addEventListener("click", handleClick);
app.addEventListener("change", handleChange);
app.addEventListener("input", handleInput);
app.addEventListener("copy", blockWritingClipboardAction, true);
app.addEventListener("cut", blockWritingClipboardAction, true);
app.addEventListener("paste", blockWritingClipboardAction, true);
app.addEventListener("dragover", blockWritingClipboardAction, true);
app.addEventListener("drop", blockWritingClipboardAction, true);
app.addEventListener("beforeinput", blockWritingBeforeInput, true);
app.addEventListener("keydown", blockWritingClipboardShortcut, true);
app.addEventListener("keyup", clearBlockedWritingEdit, true);

function render() {
  const moduleInfo = modules[appState.module];
  app.dataset.fontLevel = String(appState.fontLevel);

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
    if (isGrade2SpeakingExperience) queueMicrotask(mountGrade2SpeakingStep);
  } else if (appState.module === "listening") {
    stopListeningPlayback();
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
      ${renderDeveloperToolbar()}
      ${renderAccessPlanNotice()}
      ${renderGradePicker()}
      ${renderSetPicker()}
      <div class="start-title">${moduleInfo.title}</div>
      <button class="start-button" data-action="start">${moduleInfo.start}</button>
      ${renderModuleNavigation("受験順序")}
      ${renderImportPanel()}
      ${renderLegalNotice()}
    </section>
  `;
}

function renderAccessPlanNotice() {
  const accessText = selectedAccessPlan.key === "sample"
    ? "スピーキングから始まり、4技能の主要な操作を少しずつ無料で確認できます。"
    : selectedAccessPlan.key === "five"
    ? "第1〜5回の解説・スクリプト・模範解答と、プレミアム特典を確認できます。"
    : selectedAccessPlan.key === "three"
      ? "第1〜3回の解説・スクリプト・模範解答と、3回プレミアム特典を確認できます。"
      : "第1回を本番形式で解き、正答を確認できます。詳しい解説は3回プレミアムに含まれます。";
  const isPre1FivePack = selectedGrade === "pre1" && selectedAccessPlan.key === "five";
  const planLabel = isPre1FivePack ? "準1級・5回完成セット" : selectedAccessPlan.label;
  const planAccessText = isPre1FivePack
    ? "第1回〜第5回の演習・解説・スピーキング練習と、準1級専用の特典を利用できます。"
    : accessText;
  const grade2BonusLabel = "ライティング・スピーキング回答型・外部AI採点連携・AI振り返り・直前プラン";
  const bonusLink = canViewBonus && selectedGrade === "grade2"
    ? `<a class="access-plan-link" href="./bonus.html?plan=${encodeURIComponent(selectedAccessPlan.key)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">特典を開く（${grade2BonusLabel}）</a>`
    : "";
  const developerLink = selectedGrade === "grade2"
    ? `<a class="developer-entry-link" href="./exam.html?plan=three&set=set-01&dev=1&module=speaking&speakingStep=0&start=1&fresh=1">開発者用確認</a>`
    : "";
  const pre1BonusLink = isPre1FivePack
    ? `<a class="access-plan-link" href="./pre1-bonus.html?plan=five">特典を開く（要約・英作文・スピーキング・直前プラン・90語彙）</a>`
    : "";

  return `
    <section class="access-plan-notice ${canViewExplanations || isPre1FivePack ? "is-three" : "is-single"}" aria-label="利用プラン">
      <div>
        <span>利用プラン</span>
        <strong>${escapeHtml(planLabel)}</strong>
      </div>
      <p>${planAccessText}</p>
      ${pre1BonusLink || bonusLink}
      ${developerLink}
    </section>
  `;
}

function renderLegalNotice() {
  return `
    <section class="legal-notice">
      <strong>非公式の自主練習ツールです</strong>
      <p>英検®は公益財団法人 日本英語検定協会の登録商標です。本サービスは同協会の承認・推奨・検討を受けたものではありません。</p>
      <p>掲載している問題・音声台本・解説は独自作成です。購入前に利用条件と対応環境をご確認ください。</p>
      <nav class="app-legal-links" aria-label="販売・利用に関する案内">
        <a href="./tokusho.html">特定商取引法に基づく表記</a>
        <a href="./terms.html">利用規約</a>
        <a href="./privacy.html">プライバシーポリシー</a>
        <a href="./support.html">返金・利用期限・対応PC・お問い合わせ</a>
      </nav>
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
    ${renderModuleNavigation("受験順序")}
    ${renderDeveloperToolbar()}
  `;
}

function renderModuleNavigation(label) {
  if (!isGrade2ContinuousExam) return renderModuleTabs(label);

  const flowOrder = ["speaking", "listening", "reading", "writing"].filter(isModuleAvailable);
  const currentIndex = Math.max(0, flowOrder.indexOf(appState.module));
  const fontLevel = Math.min(FONT_LEVEL_MAX, Math.max(1, Number(appState.fontLevel) || 1));

  return `
    <nav class="module-picker exam-flow-picker" aria-label="${label}">
      ${flowOrder
        .map((key, index) => {
          const stateClass = index < currentIndex ? "is-complete" : index === currentIndex ? "is-current" : "is-upcoming";
          return `
            <span class="exam-flow-step ${stateClass}" ${index === currentIndex ? 'aria-current="step"' : ""}>
              <span class="exam-flow-index">${index + 1}</span>
              <span>${escapeHtml(modules[key].label)}</span>
            </span>
          `;
        })
        .join("")}
      <button
        class="font-size-control"
        data-action="increase-font"
        aria-label="問題文を大きくする（現在 ${fontLevel}/${FONT_LEVEL_MAX}）"
        title="問題文を大きくする"
        ${fontLevel >= FONT_LEVEL_MAX ? "disabled" : ""}
      >
        <span class="font-size-symbol" aria-hidden="true">A＋</span>
        <span class="font-size-step">${fontLevel}/${FONT_LEVEL_MAX}</span>
      </button>
      <button class="module-tab reset-tab" data-action="reset-progress">進行リセット</button>
    </nav>
  `;
}

function getDeveloperLocationValue() {
  if (appState.modal === "complete") return "result";
  if (appState.module === "speaking") return `speaking:${appState.speakingStep}`;
  if (appState.module === "listening") return `listening:${appState.listeningIndex}`;
  if (appState.module === "reading") return `reading:${appState.readingPage}:${getCurrentReadingItemIndex(readingPages[appState.readingPage])}`;
  if (appState.module === "writing") return `writing:${appState.writingTask}`;
  return "";
}

function renderDeveloperToolbar() {
  if (!isGrade2DeveloperMode) return "";
  const currentLocation = getDeveloperLocationValue();
  const moduleOrder = ["speaking", "listening", "reading", "writing"].filter(isModuleAvailable);
  const speakingOptions = speakingSteps
    .map((step, index) => `<option value="speaking:${index}" ${currentLocation === `speaking:${index}` ? "selected" : ""}>${index + 1}. ${escapeHtml(step.stage || step.label || step.phase || "工程")}</option>`)
    .join("");
  const listeningOptions = listeningQuestions
    .map((question, index) => {
      const sectionLabel = String(question.section || (index < 15 ? "Part 1" : "Part 2")).replace(/^リスニング\s*/i, "");
      return `<option value="listening:${index}" ${currentLocation === `listening:${index}` ? "selected" : ""}>${escapeHtml(sectionLabel)} / No.${escapeHtml(question.id)}</option>`;
    })
    .join("");
  const readingOptions = readingPages
    .flatMap((page, pageIndex) =>
      page.questions.map((question, questionIndex) => {
        const value = `reading:${pageIndex}:${questionIndex}`;
        return `<option value="${value}" ${currentLocation === value ? "selected" : ""}>${escapeHtml(getReadingPageDisplayLabel(page, pageIndex))} / No.${escapeHtml(question.id)}</option>`;
      }),
    )
    .join("");
  const writingOptions = writingTasks
    .map((task, index) => `<option value="writing:${index}" ${currentLocation === `writing:${index}` ? "selected" : ""}>${escapeHtml(task.label || `Writing ${index + 1}`)}</option>`)
    .join("");

  return `
    <aside class="developer-toolbar" aria-label="開発者モード">
      <div class="developer-toolbar-head">
        <div><strong>開発者モード</strong><span>通常版では表示されない自由移動ツール</span></div>
        <button data-action="dev-exit">開発者モードを終了</button>
      </div>
      ${appState.module === "listening" && appState.started ? `<div class="developer-listening-status">Listening: ${escapeHtml(listeningPlaybackPhase)} / 再生開始 ${listeningPlaybackStarts}回</div>` : ""}
      <div class="developer-toolbar-row developer-set-row" role="group" aria-label="回次">
        ${["set-01", "set-02", "set-03"]
          .map((setKey, index) => `<button data-dev-set="${setKey}" class="${selectedSet.key === setKey ? "active" : ""}">第${index + 1}回</button>`)
          .join("")}
      </div>
      <div class="developer-toolbar-row" role="group" aria-label="技能">
        ${moduleOrder
          .map((moduleKey) => `<button data-dev-module="${moduleKey}" class="${appState.modal !== "complete" && appState.module === moduleKey ? "active" : ""}">${escapeHtml(modules[moduleKey].label)}</button>`)
          .join("")}
        <button data-action="dev-result" class="${appState.modal === "complete" ? "active" : ""}">採点・解説</button>
      </div>
      <label class="developer-location-picker">
        <span>工程・設問へ移動</span>
        <select data-dev-location>
          <optgroup label="Speaking">${speakingOptions}</optgroup>
          <optgroup label="Listening Part 1 / Part 2">${listeningOptions}</optgroup>
          <optgroup label="Reading">${readingOptions}</optgroup>
          <optgroup label="Writing">${writingOptions}</optgroup>
          <option value="result" ${currentLocation === "result" ? "selected" : ""}>採点・回答解説画面</option>
        </select>
      </label>
    </aside>
  `;
}

function renderGradePicker() {
  if (isGradeLocked || availableGradeKeys.length <= 1) {
    return `<div class="grade-locked">${escapeHtml(appConfig.gradeLabel || selectedGradeLabel)}</div>`;
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
  const sets = getAccessibleExamSets(gradeCatalog[selectedGrade] || examData, selectedGrade);
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
  if (!allowDataImport) return "";

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
  const fontLevel = Math.min(FONT_LEVEL_MAX, Math.max(1, Number(appState.fontLevel) || 1));
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
      <button
        class="font-size-control"
        data-action="increase-font"
        aria-label="問題文を大きくする（現在 ${fontLevel}/${FONT_LEVEL_MAX}）"
        title="問題文を大きくする"
        ${fontLevel >= FONT_LEVEL_MAX ? "disabled" : ""}
      >
        <span class="font-size-symbol" aria-hidden="true">A＋</span>
        <span class="font-size-step">${fontLevel}/${FONT_LEVEL_MAX}</span>
      </button>
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
    appState.drawerOpen ? "drawer-open" : "drawer-closed",
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
  const answer = appState.answers.written[question.id];
  return `
    <article class="question-block" id="q-${question.id}">
      <div class="question-number">(${question.id})</div>
      <div>
        ${renderQuestionText(question)}
        ${question.choices
          .map(
            (choice, index) => `
              <button
                type="button"
                class="choice-row problem-choice ${answer === index + 1 ? "selected" : ""}"
                data-action="written-answer"
                data-question="${question.id}"
                data-value="${index + 1}"
                aria-pressed="${answer === index + 1}"
              >
                <span class="choice-button choice-marker ${answer === index + 1 ? "selected" : ""}" aria-hidden="true">
                  ${index + 1}
                </span>
                <span class="choice-text">${escapeHtml(choice)}</span>
              </button>
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
  const passageView = getPart3BPassageView(page);
  return `
    <div class="long-layout">
      <section>
        ${renderToolRow()}
        ${passageView.label ? `<div class="passage-range-label">${escapeHtml(passageView.label)}</div>` : ""}
        ${renderPassageCard(page, "", passageView.passage)}
      </section>
      <section class="side-question">
        ${visibleQuestions.map(renderCompactChoiceQuestion).join("")}
      </section>
    </div>
  `;
}

function getPart3BPassageView(page) {
  const passage = Array.isArray(page?.passage) ? page.passage : [];
  const questions = Array.isArray(page?.questions) ? page.questions : [];
  const hasExpectedQuestions = questions.map((question) => Number(question.id)).join(",") === "27,28,29,30,31";
  if (!String(page?.label || "").includes("3B") || passage.length !== 4 || !hasExpectedQuestions) {
    return { passage, label: "" };
  }

  const questionIndex = getCurrentReadingItemIndex(page);
  if (questionIndex >= 0 && questionIndex < 4) {
    return { passage: [passage[questionIndex]], label: `第${questionIndex + 1}段落` };
  }
  return { passage, label: "全文（第1〜4段落）" };
}

function renderPassageCard(page, className = "", passage = page.passage || []) {
  const extraClass = className ? ` ${className}` : "";
  return `
    <div class="passage-card${extraClass}">
      ${page.hidePassageTitle ? "" : `<strong>${escapeHtml(page.passageTitle || page.label || "長文")}</strong>`}
      ${passage.map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<br />")).join("")}
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
  const answer = appState.answers.written[question.id];
  return `
    <article class="compact-question" id="q-${question.id}">
      <div class="compact-question-text">
        <strong>(${question.id})</strong>
        <div>${formatQuestionText(question.text, question.id).map((line) => `<span>${escapeHtml(line)}</span>`).join("")}</div>
      </div>
      ${question.choices
        .map(
          (choice, index) => `
            <button
              type="button"
              class="choice-row compact problem-choice ${answer === index + 1 ? "selected" : ""}"
              data-action="written-answer"
              data-question="${question.id}"
              data-value="${index + 1}"
              aria-pressed="${answer === index + 1}"
            >
              <span class="choice-button choice-marker ${answer === index + 1 ? "selected" : ""}" aria-hidden="true">
                ${index + 1}
              </span>
              <span class="choice-text">${escapeHtml(choice)}</span>
            </button>
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
  const isGrade2Summary = isGrade2SummaryTask(task);
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
                ${task.warning ? `<p>● ${escapeHtml(task.warning)}</p>` : ""}
                ${isGrade2Summary ? "" : `<p>● ${escapeHtml(task.wordRule || "語数の目安")}は${escapeHtml(task.targetWords)}です。</p>`}
              </div>
              ${renderWritingConditions(task)}
              ${renderToolRow()}
              <div class="email-card">
                ${task.sourceTitle ? `<strong>${escapeHtml(task.sourceTitle)}</strong>` : ""}
                ${task.source.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
              </div>
              ${renderWritingPoints(task)}
            </section>
            <section class="writing-answer">
              <h3>解答欄</h3>
              ${task.fixedBefore ? `<p>${escapeHtml(task.fixedBefore).replace(/\n/g, "<br />")}</p>` : ""}
              <div data-word-row class="word-row ${wordStatus.className}">
                <span data-word-status class="word-status ${wordStatus.className}">${escapeHtml(wordStatus.label)}</span>
                <strong data-word-count class="word-count ${wordStatus.className}">${wordStatus.count}語</strong>
              </div>
              <textarea
                class="writing-textarea"
                data-writing-id="${task.id}"
                oncopy="return false"
                oncut="return false"
                onpaste="return false"
                ondragover="return false"
                ondrop="return false"
                oninput="return guardWritingInlineInput(event)"
              >${escapeHtml(value)}</textarea>
              ${task.fixedAfter ? `<p>${escapeHtml(task.fixedAfter)}</p>` : ""}
              ${renderWritingSelfCheck(task)}
              <div class="writing-actions">
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
  const showPointsRule = !isGrade2WritingTask(task);

  return `
    <div class="points-card">
      <strong>POINTS</strong>
      ${showPointsRule ? `<p>${escapeHtml(task.pointsRule || "理由を書く際の参考となる観点です。")}</p>` : ""}
      <div class="points-list">
        ${task.points.map((point) => `<span>${escapeHtml(point)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderWritingConditions(task) {
  if (isGrade2WritingTask(task)) return "";
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
  if (isGrade2WritingTask(task)) return "";
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

function isGrade2SummaryTask(task) {
  return selectedGrade === "grade2" && task?.kind === "summary";
}

function isGrade2WritingTask(task) {
  return selectedGrade === "grade2" && (task?.kind === "summary" || task?.kind === "essay");
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
  if (listeningInstructionAudioElement) {
    listeningInstructionAudioElement.pause();
    listeningInstructionAudioElement.removeAttribute("src");
    listeningInstructionAudioElement.load();
  }
  if (listeningAudioElement) {
    listeningAudioElement.pause();
    listeningAudioElement.removeAttribute("src");
    listeningAudioElement.load();
  }
  if (listeningSpeechUtterance && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  listeningInstructionAudioElement = null;
  listeningAudioElement = null;
  listeningSpeechUtterance = null;
  listeningPlaybackQuestionId = null;
  listeningPlaybackPhase = "idle";
  listeningAnswerDeadline = 0;
}

function getGrade2OutputVolume() {
  return Math.max(0, Math.min(1, (Number(appState.speakingOutputVolume) || 70) / 100));
}

function getListeningAudioVolume(question) {
  const itemNumber = Number(question?.id);
  const itemGain = GRADE2_LISTENING_AUDIO_GAINS[selectedSet.key]?.[itemNumber - 1] || 1;
  return Math.max(0, Math.min(1, getGrade2OutputVolume() * itemGain));
}

function resetListeningAnswerCountdown() {
  appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  listeningAnswerDeadline = 0;
}

async function replayListeningAudioForDeveloper() {
  if (!isGrade2DeveloperMode) return;
  const question = listeningQuestions[appState.listeningIndex];
  if (!question?.audioFile && !question?.script) return;

  if (listeningInstructionAudioElement) listeningInstructionAudioElement.pause();
  if (listeningAudioElement) {
    listeningAudioElement.pause();
    listeningAudioElement.currentTime = 0;
  }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  listeningInstructionAudioElement = null;
  listeningSpeechUtterance = null;
  listeningPlaybackQuestionId = question.id;
  resetListeningAnswerCountdown();
  listeningPlaybackPhase = question.audioFile ? "audio" : "blocked";
  await playListeningAudio({ skipInstruction: true });
}

function getGrade2ListeningSectionKey(question) {
  if (!isGrade2SpeakingExperience) return "";
  const label = `${question?.part || ""} ${question?.section || ""}`.toLowerCase();
  if (/part\s*1|第\s*1\s*部/.test(label)) return "part1";
  if (/part\s*2|第\s*2\s*部/.test(label)) return "part2";
  return "";
}

function needsGrade2ListeningInstruction(question) {
  if (appState.listeningReviewMode) return false;
  const sectionKey = getGrade2ListeningSectionKey(question);
  return Boolean(sectionKey && !appState.listeningIntroducedSections[sectionKey]);
}

function hasPlayedListeningQuestion(questionId) {
  return Boolean(appState.listeningPlayedQuestionIds[String(questionId)]);
}

function markListeningQuestionPlayed(questionId) {
  if (questionId === null || questionId === undefined) return;
  appState.listeningPlayedQuestionIds[String(questionId)] = true;
  saveState();
}

async function playGrade2ListeningInstruction(question) {
  const sectionKey = getGrade2ListeningSectionKey(question);
  const audioUrl = GRADE2_LISTENING_INSTRUCTION_AUDIO[sectionKey];
  if (!sectionKey || !audioUrl || appState.listeningIntroducedSections[sectionKey]) return false;

  const instructionAudio = new Audio(audioUrl);
  listeningInstructionAudioElement = instructionAudio;
  instructionAudio.preload = "auto";
  instructionAudio.volume = getListeningAudioVolume(question);
  listeningPlaybackPhase = "instruction";
  updateListeningPlaybackUi();
  instructionAudio.addEventListener(
    "ended",
    () => {
      if (listeningInstructionAudioElement !== instructionAudio || listeningPlaybackQuestionId !== question.id) return;
      listeningInstructionAudioElement = null;
      appState.listeningIntroducedSections[sectionKey] = true;
      listeningPlaybackPhase = question.audioFile ? "audio" : question.script ? "blocked" : "answer";
      saveState();
      updateListeningPlaybackUi();
      playListeningAudio();
    },
    { once: true },
  );
  instructionAudio.addEventListener(
    "error",
    () => {
      if (listeningInstructionAudioElement !== instructionAudio) return;
      listeningInstructionAudioElement = null;
      listeningPlaybackPhase = "instruction-error";
      updateListeningPlaybackUi();
    },
    { once: true },
  );
  try {
    listeningPlaybackStarts += 1;
    await instructionAudio.play();
  } catch {
    if (listeningInstructionAudioElement === instructionAudio) listeningInstructionAudioElement = null;
    listeningPlaybackPhase = "instruction-error";
    updateListeningPlaybackUi();
  }
  return true;
}

function startListeningAnswerCountdown() {
  listeningPlaybackPhase = "answer";
  appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  listeningAnswerDeadline = Date.now() + LISTENING_ANSWER_SECONDS * 1000;
}

function ensureListeningPlaybackState() {
  const question = listeningQuestions[appState.listeningIndex];
  if (!question || listeningPlaybackQuestionId === question.id) return;
  stopListeningPlayback();
  listeningPlaybackQuestionId = question.id;
  if (appState.listeningReviewMode) {
    listeningPlaybackPhase = "review";
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (hasPlayedListeningQuestion(question.id)) {
    listeningPlaybackPhase = "review-answer";
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (needsGrade2ListeningInstruction(question)) {
    listeningPlaybackPhase = "instruction";
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (question.audioFile) {
    listeningPlaybackPhase = "audio";
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (question.script) {
    listeningPlaybackPhase = "blocked";
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else {
    startListeningAnswerCountdown();
  }
}

function updateListeningPlaybackUi() {
  const question = listeningQuestions[appState.listeningIndex];
  const hasPlayback = Boolean(question?.audioFile || question?.script);
  const usesBrowserVoice = Boolean(question?.script && !question?.audioFile);
  const isReviewPhase = appState.listeningReviewMode || ["review", "review-answer"].includes(listeningPlaybackPhase);
  const isAnswerPhase = !hasPlayback || listeningPlaybackPhase === "answer" || isReviewPhase;
  const status = app.querySelector("[data-listening-audio-status] span");
  const playButton = app.querySelector('[data-action="listen-play"]');
  const answerTime = app.querySelector(".answer-time");
  const phaseLabel = app.querySelector("[data-listening-phase-label]");
  const timer = app.querySelector("[data-listening-timer]");
  const timerUnit = app.querySelector("[data-listening-timer-unit]");
  const timerBar = app.querySelector("[data-listening-answer-bar]");

  if (status) {
    status.textContent = isReviewPhase
      ? "復習モードです。音声を聞く場合は再生ボタンを押してください。"
      : !hasPlayback
      ? "音声・台本が設定されていません。"
      : listeningPlaybackPhase === "instruction"
        ? "日本語の試験説明を再生しています。続けて問題音声が始まります。"
        : listeningPlaybackPhase === "instruction-error"
          ? "日本語の試験説明を再生するには、再生ボタンを押してください。"
      : listeningPlaybackPhase === "answer"
        ? "音声が終了しました。10秒後に自動で次の問題へ進みます。"
        : listeningPlaybackPhase === "blocked" || listeningPlaybackPhase === "error"
          ? usesBrowserVoice
            ? "ブラウザ音声で台本を再生します。再生ボタンを押してください。"
            : "音声を再生するには再生ボタンを押してください。"
          : usesBrowserVoice
            ? "ブラウザ音声で台本を再生しています。"
            : "音声を再生しています。";
  }
  if (playButton) playButton.hidden = !hasPlayback || (!isReviewPhase && !["blocked", "error", "instruction-error"].includes(listeningPlaybackPhase));
  if (answerTime) answerTime.classList.toggle("waiting", !isAnswerPhase);
  const audioPhaseLabel = listeningPlaybackPhase === "instruction"
    ? "試験説明"
    : ["blocked", "error", "instruction-error"].includes(listeningPlaybackPhase)
      ? "音声再生待ち"
      : "音声再生中";
  if (phaseLabel) phaseLabel.textContent = isReviewPhase ? "復習中" : isAnswerPhase ? "解答時間" : audioPhaseLabel;
  if (timer) timer.textContent = isReviewPhase ? "--" : isAnswerPhase ? appState.listeningAnswerRemaining : "--";
  if (timerUnit) timerUnit.textContent = isReviewPhase ? "" : isAnswerPhase ? "秒" : "";
  if (timerBar) {
    const percent = isAnswerPhase ? Math.max(0, Math.min(100, (appState.listeningAnswerRemaining / LISTENING_ANSWER_SECONDS) * 100)) : 100;
    timerBar.style.width = `${percent}%`;
  }
}

async function playListeningAudio({ force = false, skipInstruction = false } = {}) {
  const question = listeningQuestions[appState.listeningIndex];
  if (!question) return;
  if (!force && !appState.listeningReviewMode && hasPlayedListeningQuestion(question.id)) {
    listeningPlaybackPhase = "review-answer";
    updateListeningPlaybackUi();
    return;
  }
  if (!skipInstruction && needsGrade2ListeningInstruction(question)) {
    await playGrade2ListeningInstruction(question);
    return;
  }
  if (!question?.audioFile && question?.script) {
    if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      listeningPlaybackPhase = "error";
      updateListeningPlaybackUi();
      return;
    }
    window.speechSynthesis.cancel();
    const spokenScript = String(question.script).replace(/(^|\s)[A-Z]{1,2}:\s*/g, "$1");
    const spokenQuestion =
      question.part === "Part 1"
        ? question.choices.map((choice, index) => `Option ${index + 1}. ${choice}`).join(" ")
        : question.questionText
          ? `Question. ${question.questionText}`
          : "";
    const utterance = new SpeechSynthesisUtterance(`${spokenScript} ${spokenQuestion}`.trim());
    listeningSpeechUtterance = utterance;
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = getListeningAudioVolume(question);
    utterance.addEventListener(
      "end",
      () => {
        if (listeningPlaybackQuestionId !== question.id || listeningSpeechUtterance !== utterance) return;
        listeningSpeechUtterance = null;
        if (appState.listeningReviewMode) {
          listeningPlaybackPhase = "review";
        } else {
          startListeningAnswerCountdown();
        }
        saveState();
        updateListeningPlaybackUi();
      },
      { once: true },
    );
    utterance.addEventListener(
      "error",
      () => {
        if (listeningPlaybackQuestionId !== question.id || listeningSpeechUtterance !== utterance) return;
        listeningSpeechUtterance = null;
        listeningPlaybackPhase = "error";
        updateListeningPlaybackUi();
      },
      { once: true },
    );
    listeningPlaybackPhase = "audio";
    markListeningQuestionPlayed(question.id);
    updateListeningPlaybackUi();
    listeningPlaybackStarts += 1;
    window.speechSynthesis.speak(utterance);
    return;
  }
  if (!question?.audioFile) return;
  const audio = listeningAudioElement || app.querySelector("[data-listening-audio]");
  if (!audio) return;
  listeningAudioElement = audio;
  listeningPlaybackPhase = "audio";
  audio.volume = getListeningAudioVolume(question);
  updateListeningPlaybackUi();
  try {
    audio.currentTime = 0;
    listeningPlaybackStarts += 1;
    await audio.play();
  } catch {
    listeningPlaybackPhase = "blocked";
    updateListeningPlaybackUi();
  }
}

function mountListeningAudio() {
  const question = listeningQuestions[appState.listeningIndex];
  if (["answer", "review", "review-answer"].includes(listeningPlaybackPhase)) {
    updateListeningPlaybackUi();
    return;
  }
  if (question?.audioFile) {
    const audio = app.querySelector("[data-listening-audio]");
    if (!audio) return;
    const questionId = question.id;
    listeningAudioElement = audio;
    audio.addEventListener("playing", () => {
      if (listeningPlaybackQuestionId !== questionId) return;
      markListeningQuestionPlayed(questionId);
      listeningPlaybackPhase = "audio";
      updateListeningPlaybackUi();
    });
    audio.addEventListener("ended", () => {
      if (listeningPlaybackQuestionId !== questionId) return;
      if (appState.listeningReviewMode) {
        listeningPlaybackPhase = "review";
      } else {
        startListeningAnswerCountdown();
      }
      saveState();
      updateListeningPlaybackUi();
    });
    audio.addEventListener("error", () => {
      if (listeningPlaybackQuestionId !== questionId) return;
      listeningPlaybackPhase = "error";
      updateListeningPlaybackUi();
    });
  }
  playListeningAudio();
}

function renderListening() {
  const question = listeningQuestions[appState.listeningIndex];
  const hasPlayback = Boolean(question.audioFile || question.script);
  const usesBrowserVoice = Boolean(question.script && !question.audioFile);
  const isRealLifeQuestion = question.part === "Part 3" && Boolean(question.situation);
  const isReviewPhase = appState.listeningReviewMode || ["review", "review-answer"].includes(listeningPlaybackPhase);
  const canNavigateListening = appState.listeningReviewMode || isGrade2DeveloperMode;
  const isAnswerPhase = !hasPlayback || listeningPlaybackPhase === "answer" || isReviewPhase;
  const audioStatusText = !hasPlayback
    ? "音声・台本が設定されていません。"
    : listeningPlaybackPhase === "instruction"
      ? "日本語の試験説明を再生しています。続けて問題音声が始まります。"
      : listeningPlaybackPhase === "instruction-error"
        ? "日本語の試験説明を再生するには、再生ボタンを押してください。"
    : listeningPlaybackPhase === "answer"
      ? "音声が終了しました。10秒後に自動で次の問題へ進みます。"
      : listeningPlaybackPhase === "blocked" || listeningPlaybackPhase === "error"
        ? usesBrowserVoice
          ? "ブラウザ音声で台本を再生します。再生ボタンを押してください。"
          : "音声を再生するには再生ボタンを押してください。"
        : usesBrowserVoice
          ? "ブラウザ音声で台本を再生しています。"
          : "音声を再生しています。";
  return `
    ${renderHeader(`${question.section} No.${question.id}を再生中...`)}
    <section class="listen-frame">
      <main class="listen-main">
        <div class="section-description">
          <div class="section-badge">${question.section}</div>
          <p>${question.instruction}</p>
        </div>
        <div class="audio-status ${hasPlayback ? "" : "muted"}" data-listening-audio-status>
          <span>${audioStatusText}</span>
          ${hasPlayback ? `<button class="listen-play-button" data-action="listen-play" ${["blocked", "error", "instruction-error"].includes(listeningPlaybackPhase) ? "" : "hidden"}>▶ 音声を再生</button>` : ""}
          ${isGrade2DeveloperMode && hasPlayback ? `<button class="listen-play-button developer-listen-replay" data-action="listen-replay-dev">↻ この問題を最初から聞き直す</button>` : ""}
        </div>
        ${question.audioFile ? `<audio class="listen-audio-element" data-listening-audio preload="metadata" src="${escapeHtml(question.audioFile)}"></audio>` : ""}
        ${canNavigateListening ? `<button class="nav-button prev" data-action="listen-prev" ${appState.listeningIndex === 0 ? "disabled" : ""}>▲ 前の問題へ</button>` : ""}
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
          ${canNavigateListening ? `<button class="nav-button next" data-action="listen-next">${appState.listeningIndex === listeningQuestions.length - 1 ? "リスニング終了 ▼" : "次の問題へ ▼"}</button>` : ""}
        <div class="answer-time ${isAnswerPhase ? "" : "waiting"}">
          <span data-listening-phase-label>${isAnswerPhase ? "解答時間" : listeningPlaybackPhase === "instruction" ? "試験説明" : ["blocked", "error", "instruction-error"].includes(listeningPlaybackPhase) ? "音声再生待ち" : "音声再生中"}</span>
          <div class="answer-time-meter">
            <div class="answer-time-track" aria-hidden="true"><span data-listening-answer-bar style="width: ${isAnswerPhase ? Math.max(0, Math.min(100, (appState.listeningAnswerRemaining / LISTENING_ANSWER_SECONDS) * 100)) : 100}%"></span></div>
            <div class="answer-time-box"><span data-listening-timer>${isAnswerPhase ? appState.listeningAnswerRemaining : "--"}</span><span data-listening-timer-unit>${isAnswerPhase ? "秒" : ""}</span></div>
          </div>
        </div>
      </main>
      <aside class="listen-side">
        ${appState.listeningReviewMode ? `<button class="current-button" data-action="listen-review-close">復習を終了して結果へ戻る</button>` : ""}
        <button class="current-button" data-action="listen-current">再生中の問題を表示する</button>
        <div class="listen-list">
          ${renderListeningAnswerSections(canNavigateListening)}
        </div>
        <div class="volume-box">
          <strong>音量</strong>
          <div class="volume-row">
            <span>小</span>
            <input data-speaking-volume type="range" min="0" max="100" value="${Number(appState.speakingOutputVolume) || 70}" aria-label="音声の音量" />
            <span>大</span>
          </div>
        </div>
      </aside>
    </section>
  `;
}

function renderListeningAnswerSections(canNavigateListening) {
  const indexedQuestions = listeningQuestions.map((item, index) => ({ item, index }));
  const sections = isGrade2SpeakingExperience && listeningQuestions.length === 30
    ? [
        { key: "part1", label: "第1部", questions: indexedQuestions.slice(0, 15) },
        { key: "part2", label: "第2部", questions: indexedQuestions.slice(15, 30) },
      ]
    : [{ key: "all", label: "", questions: indexedQuestions }];

  return sections
    .map(
      (section) => `
        <section class="listen-section listen-section-${section.key}" ${section.label ? `aria-label="${section.label}"` : ""}>
          ${section.label ? `<div class="listen-section-title">${section.label}</div>` : ""}
          <div class="listen-section-grid">
            ${section.questions.map(({ item, index }) => renderListeningListRow(item, index, canNavigateListening)).join("")}
          </div>
        </section>
      `,
    )
    .join("");
}

function renderListeningListRow(item, index, canNavigateListening) {
  return `
    <div class="listen-list-row ${index === appState.listeningIndex ? "current" : ""}">
      ${canNavigateListening ? `<button class="listen-jump" data-action="listen-goto" data-page="${index}">No.${item.id}</button>` : `<span class="listen-jump listen-jump-static">No.${item.id}</span>`}
      <input class="listen-mark" type="checkbox" data-review-question="l-${item.id}" ${appState.reviews[`l-${item.id}`] ? "checked" : ""} />
      ${canNavigateListening ? `<button class="listen-box ${appState.answers.listening[item.id] ? "answered" : ""}" data-action="listen-goto" data-page="${index}">${appState.answers.listening[item.id] || ""}</button>` : `<span class="listen-box listen-box-static ${appState.answers.listening[item.id] ? "answered" : ""}">${appState.answers.listening[item.id] || ""}</span>`}
    </div>
  `;
}

function renderSpeaking() {
  if (isGrade2SpeakingExperience) return renderGrade2Speaking();
  const step = speakingSteps[appState.speakingStep];
  const stepIndex = appState.speakingStep;
  return `
    ${renderHeader("音量調整")}
    <section class="speaking-frame ${step.pictureImageSrc ? "pre1-speaking-flow" : ""}">
      <div class="speaking-head">
        <div>${selectedGradeDisplay}</div>
        <label class="volume-row">
          <span>音量調整</span>
          <span>小</span>
          <input type="range" min="0" max="100" value="60" />
          <span>大</span>
        </label>
      </div>
      ${renderSpeakingDevTools()}
      <div class="speaking-body">
        <div class="interviewer ${step.visual === "カード" ? "card-visual" : ""} ${step.pictureImageSrc ? "pre1-card-visual" : ""}">
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

function renderSpeakingDevTools() {
  if (!isGrade2DeveloperMode) return "";
  const sectionStartIndex = speakingSteps.findIndex((step) => step.phase === "section-start");
  const canSkipChecks = isGrade2SpeakingExperience && sectionStartIndex > 0 && appState.speakingStep < sectionStartIndex;
  return `
    <div class="speaking-dev-tools" role="group" aria-label="開発用スピーキング操作">
      <div>
        <strong>開発用</strong>
        <span>マイク・録音を使わず画面遷移を確認</span>
      </div>
      <div class="speaking-dev-actions">
        ${canSkipChecks ? `<button data-action="speaking-dev-skip-checks">受験前チェックをスキップ</button>` : ""}
        <button data-action="speaking-dev-prev" ${appState.speakingStep === 0 ? "disabled" : ""}>前へ</button>
        <button data-action="speaking-dev-next" ${appState.speakingStep >= speakingSteps.length - 1 ? "disabled" : ""}>録音せず次へ</button>
      </div>
    </div>
  `;
}

function renderGrade2Speaking() {
  const step = speakingSteps[appState.speakingStep] || speakingSteps[0];
  const status = appState.speakingPhaseStatus || "idle";
  const timerVisible = step.seconds > 0 && !["idle", "awaiting-choice"].includes(status);
  const replayCount = Number(appState.speakingReplayCounts[step.id]) || 0;
  const replayRemaining = Math.max(0, Number(step.replayLimit || 0) - replayCount);

  return `
    ${renderHeader("スピーキング")}
    <section class="speaking-frame grade2-speaking-flow">
      <div class="speaking-head grade2-speaking-head">
        <div>
          <strong>${escapeHtml(selectedGradeDisplay)}</strong>
          <span class="speaking-set-label">${escapeHtml(selectedSetLabel)}</span>
        </div>
        <label class="volume-row speaking-volume-control">
          <span>音量</span>
          <span>小</span>
          <input data-speaking-volume type="range" min="0" max="100" value="${Number(appState.speakingOutputVolume) || 70}" aria-label="案内音声の音量" />
          <span>大</span>
        </label>
      </div>
      ${renderSpeakingDevTools()}
      <div class="speaking-progress" aria-label="スピーキングの進行状況">
        <div class="speaking-progress-bar" style="width:${Math.round(((appState.speakingStep + 1) / speakingSteps.length) * 100)}%"></div>
      </div>
      <div class="speaking-body grade2-speaking-body ${step.visual === "picture" ? "picture-story-layout" : ""}">
        <div class="interviewer grade2-speaking-stage ${["card", "picture"].includes(step.visual) ? "card-visual" : ""}">
          ${renderGrade2SpeakingVisual(step)}
        </div>
        <aside class="speaking-card grade2-speaking-panel">
          <div class="speaking-stage-row">
            <span class="speaking-stage-chip">${escapeHtml(step.stage || step.label)}</span>
            ${step.practiceOnly ? `<span class="speaking-practice-chip">採点対象外</span>` : ""}
          </div>
          <h2>${escapeHtml(step.label)}</h2>
          <p class="speaking-instruction">${escapeHtml(step.prompt || "")}</p>
          ${renderGrade2SpeakingStatus(step, status, timerVisible)}
          ${renderGrade2SpeakingMicMeter(step, status)}
          ${renderGrade2SpeakingActions(step, status, replayRemaining)}
          ${renderGrade2SpeakingDevSkip(step)}
          ${step.replayLimit ? `<p class="speaking-replay-note">質問の聞き直し：あと${replayRemaining}回</p>` : ""}
          <p class="speaking-privacy-note">録音はこの端末内に保存されます。外部サービスには自動送信されません。</p>
        </aside>
      </div>
    </section>
  `;
}

function renderGrade2SpeakingVisual(step) {
  if (step.visual === "card") {
    return `
      <article class="grade2-passage-card">
        <div class="grade2-card-heading">2級 Speaking Card</div>
        <h3>${escapeHtml(step.cardTitle || "Passage")}</h3>
        <p>${escapeHtml(step.cardText || "")}</p>
      </article>
    `;
  }

  if (step.visual === "picture") {
    if (step.pictureStory?.imageSrc) {
      const story = step.pictureStory;
      const firstSpeechTail = ["left", "center", "right"].includes(story.firstSpeechTail) ? story.firstSpeechTail : "center";
      return `
        <article class="grade2-picture-card grade2-picture-story-card">
          <div class="grade2-card-heading">2級 Speaking Card</div>
          <p class="grade2-story-opening">
            <span>Your story should begin with this sentence:</span>
            <strong>${escapeHtml(story.openingSentence || "")}</strong>
          </p>
          <figure class="grade2-picture-story-visual" aria-label="3コマのイラスト">
            <div class="grade2-story-cue-row">
              <span
                class="grade2-story-bubble grade2-story-bubble-first grade2-story-bubble-tail-${firstSpeechTail}"
                aria-label="${escapeHtml(`${story.firstSpeechSpeaker || "A character"} says: ${story.firstSpeech || ""}`)}"
              >
                <span class="grade2-story-bubble-speaker">${escapeHtml(story.firstSpeechSpeaker || "A character")}</span>
                <span>${escapeHtml(story.firstSpeech || "")}</span>
              </span>
              <span class="grade2-story-time grade2-story-time-first">${escapeHtml(story.firstTimeLabel || "")}</span>
              <span class="grade2-story-time grade2-story-time-second">${escapeHtml(story.secondTimeLabel || "")}</span>
            </div>
            <div class="grade2-picture-story-image">
              <img src="${escapeHtml(story.imageSrc)}" alt="" />
            </div>
          </figure>
        </article>
      `;
    }

    return `
      <article class="grade2-picture-card">
        <div class="grade2-card-heading">Picture Story</div>
        <div class="grade2-picture-panels">
          ${(step.picturePanels || [])
            .map(
              (panel) => `
                <section class="grade2-picture-panel">
                  <span class="picture-panel-number">${Number(panel.number)}</span>
                  <div class="picture-panel-icon" aria-hidden="true">${escapeHtml(panel.icon || "")}</div>
                  <p>${escapeHtml(panel.text || "")}</p>
                </section>
              `,
            )
            .join("")}
        </div>
      </article>
    `;
  }

  if (step.visual === "setup") {
    return `
      <div class="speaking-setup-visual">
        <div class="speaking-headset-icon" aria-hidden="true">🎧</div>
        <h3>音声・マイクチェック</h3>
        <ol>
          <li>案内音声を聞く</li>
          <li>マイク入力を確認する</li>
          <li>5秒録音して再生する</li>
        </ol>
      </div>
    `;
  }

  if (step.visual === "review") {
    return `
      <div class="speaking-finish-visual">
        <div class="speaking-finish-mark" aria-hidden="true">✓</div>
        <h3>Speaking completed</h3>
        <p>おつかれさまでした。</p>
      </div>
    `;
  }

  return `
    <div class="grade2-examiner">
      <img
        class="grade2-examiner-photo"
        src="assets/grade2-speaking-examiner-photo.png"
        alt="Foreign examiner seated at a desk"
      />
      <div class="examiner-room">
        <div class="examiner-avatar" aria-label="面接官">
          <span class="examiner-hair"></span>
          <span class="examiner-face"><i></i><i></i><b></b></span>
          <span class="examiner-body"></span>
        </div>
        <div class="examiner-nameplate">
          <strong>Examiner</strong>
          <span>Grade 2 Speaking</span>
        </div>
      </div>
    </div>
  `;
}

function renderGrade2SpeakingStatus(step, status, timerVisible) {
  const statusMap = {
    idle: step.autoStart ? "まもなく自動で始まります" : "準備してください",
    prompting: "案内・質問を聞いてください",
    counting: "準備時間です",
    recording: "録音中です",
    "awaiting-choice": "Yes または No を選んでください",
    error: "確認が必要です",
  };
  const statusLabel = step.phase === "review" ? "すべての問題が終了しました" : statusMap[status] || "準備してください";
  return `
    <div class="speaking-live-status ${escapeHtml(status)}">
      <span class="speaking-status-dot"></span>
      <strong>${escapeHtml(statusLabel)}</strong>
      ${timerVisible ? `<span class="speaking-large-timer" data-speaking-timer>${formatClock(appState.speakingRemaining)}</span>` : ""}
    </div>
    ${step.phase !== "review" && appState.speakingRecordMessage ? `<p class="speaking-system-message">${escapeHtml(appState.speakingRecordMessage)}</p>` : ""}
  `;
}

function renderGrade2SpeakingMicMeter(step, status) {
  const showMeter = step.phase === "microphone-check" || status === "recording";
  if (!showMeter) return "";
  return `
    <div class="speaking-level-wrap">
      <div class="speaking-level-label">
        <span>マイク入力</span>
        <span>小さすぎないように話してください</span>
      </div>
      <div class="speaking-level-track" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="speaking-level-fill"></div>
        <span class="speaking-level-guide low"></span>
        <span class="speaking-level-guide high"></span>
      </div>
    </div>
  `;
}

function renderGrade2SpeakingDevSkip(step) {
  const preflightPhases = ["setup", "output-check", "microphone-check", "test-recording", "test-playback"];
  if (!isGrade2DeveloperMode || !preflightPhases.includes(step.phase)) return "";
  return `
    <div class="speaking-dev-skip-panel">
      <strong>開発用</strong>
      <button data-action="speaking-dev-skip-checks">受験前チェックを全部スキップ</button>
      <span>音声・マイク・テスト録音を省略して「スピーキング開始」へ進みます。</span>
    </div>
  `;
}

function renderGrade2SpeakingActions(step, status, replayRemaining) {
  if (step.phase === "setup") {
    return `<div class="speaking-primary-actions"><button class="start-button compact" data-action="grade2-speaking-next">確認して次へ</button></div>`;
  }

  if (step.phase === "output-check") {
    return `
      <div class="speaking-primary-actions">
        <button class="small-action" data-action="grade2-speaking-output-test">確認音声を再生</button>
        <button class="start-button compact" data-action="grade2-speaking-next">この音量で次へ</button>
      </div>
    `;
  }

  if (step.phase === "microphone-check") {
    return `
      <div class="speaking-primary-actions">
        <button class="small-action" data-action="grade2-speaking-mic-check">マイクを確認</button>
        <button class="start-button compact" data-action="grade2-speaking-next" ${appState.speakingMicReady ? "" : "disabled"}>入力を確認して次へ</button>
      </div>
      ${appState.speakingMicMessage ? `<p class="speaking-check-message">${escapeHtml(appState.speakingMicMessage)}</p>` : ""}
    `;
  }

  if (step.phase === "test-recording") {
    return `
      <div class="speaking-primary-actions">
        ${
          status === "recording"
            ? `<button class="small-action danger" data-action="grade2-speaking-finish-answer">録音を終了</button>`
            : `<button class="start-button compact" data-action="grade2-speaking-test-record">5秒録音する</button>`
        }
      </div>
    `;
  }

  if (step.phase === "test-playback") {
    const testIndex = speakingSteps.findIndex((item) => item.id === "test-recording");
    const url = speakingRecordingUrls[testIndex] || "";
    return `
      <div class="speaking-test-playback">
        ${url ? `<audio class="speaking-audio" controls src="${url}"></audio>` : `<p>録音を読み込んでいます。</p>`}
      </div>
      <div class="speaking-primary-actions">
        <button class="small-action" data-action="grade2-speaking-test-retry">録音をやり直す</button>
        <button class="start-button compact" data-action="grade2-speaking-test-confirm" ${url ? "" : "disabled"}>声を確認して次へ</button>
      </div>
    `;
  }

  if (step.phase === "section-start") {
    return `<div class="speaking-primary-actions"><button class="start-button compact" data-action="grade2-speaking-start-exam">スピーキングを開始</button></div>`;
  }

  if (step.phase === "review") return renderGrade2SpeakingReview();

  if (status === "awaiting-choice") {
    return `
      <div class="speaking-choice-actions" role="group" aria-label="YesまたはNoを選択">
        <button data-action="grade2-speaking-choice" data-choice="yes">Yes</button>
        <button data-action="grade2-speaking-choice" data-choice="no">No</button>
      </div>
    `;
  }

  if (status === "recording") {
    return `
      <div class="speaking-primary-actions">
        ${step.replayLimit && replayRemaining > 0 ? `<button class="small-action" data-action="grade2-speaking-replay">もう一度聞いてやりなおす</button>` : ""}
        <button class="small-action danger" data-action="grade2-speaking-finish-answer">回答を終える</button>
      </div>
    `;
  }

  if (status === "idle" && step.autoStart) {
    return `<div class="speaking-primary-actions"><button class="small-action" data-action="grade2-speaking-begin">音声を開始する</button></div>`;
  }

  return "";
}

function getGrade2ScoredSpeakingSteps() {
  const scoredIds = new Set(["read-aloud", "no-1", "no-2", "no-3", "no-4"]);
  return speakingSteps.map((step, index) => ({ step, index })).filter(({ step }) => scoredIds.has(step.id));
}

function renderGrade2SpeakingReviewV2() {
  const scoredSteps = getGrade2ScoredSpeakingSteps();
  const missingLabels = scoredSteps
    .filter(({ index }) => !appState.speakingRecordings[index])
    .map(({ step }) => step.label);

  if (appState.speakingBreakOpen) {
    return `
      <div class="speaking-section-complete speaking-break-panel">
        <div>
          <h3>休憩中（練習用）</h3>
          <p>本番のS-CBTには、スピーキングとリスニングの間の休憩はありません。準備ができたらリスニングへ進んでください。</p>
        </div>
      </div>
      <div class="speaking-primary-actions">
        <button class="start-button compact" data-action="grade2-speaking-resume">リスニングへ進む</button>
      </div>
    `;
  }

  return `
    <div class="speaking-section-complete">
      <div>
        <h3>スピーキングは終了しました</h3>
        <p>録音はこの端末内に保存されています。本番形式では、そのままリスニングへ進みます。</p>
      </div>
    </div>
    ${missingLabels.length ? `<p class="speaking-record-message error">未保存の採点対象録音：${escapeHtml(missingLabels.join("、"))}</p>` : ""}
    ${appState.speakingRecordMessage ? `<p class="speaking-record-message">${escapeHtml(appState.speakingRecordMessage)}</p>` : ""}
    <div class="speaking-primary-actions">
      <button class="start-button compact" data-action="grade2-speaking-continue">そのままリスニングへ進む（本番形式）</button>
      <button class="small-action" data-action="grade2-speaking-break">一旦休憩する（練習用・本番には休憩なし）</button>
      <button class="small-action" data-action="grade2-speaking-download-all" ${missingLabels.length ? "disabled" : ""}>採点用5音声をまとめてダウンロード</button>
      <button class="small-action" data-action="grade2-speaking-copy-grading-prompt">スピーキング単体のAI振り返り用プロンプトをコピー</button>
    </div>
    <p class="speaking-download-note">保存先はブラウザ標準のダウンロード先（通常はWindowsの「ダウンロード」）です。複数ダウンロードが拒否された場合は、下の個別ボタンを使用してください。</p>
    <p class="speaking-download-note">このプロンプトはスピーキング単体の振り返り用です。最終的なWriting・Speaking採点JSONは、4技能終了後の結果画面から作成します。</p>
    <div class="speaking-review-list compact-list">
      ${scoredSteps
        .map(({ step, index }) => {
          const recording = appState.speakingRecordings[index];
          return `<section class="speaking-review-item"><div><strong>${escapeHtml(step.label)}</strong><span>${recording ? formatBytes(recording.size || 0) : "録音なし"}</span></div>${recording ? `<button class="small-action" data-action="speaking-record-download" data-step="${index}">個別ダウンロード</button>` : ""}</section>`;
        })
        .join("")}
    </div>
  `;
}

function getGrade2SpeakingGradingPrompt() {
  const items = getGrade2ScoredSpeakingSteps().map(({ step, index }, order) => ({
    order: order + 1,
    fileName: buildSpeakingRecordingFileName(index, appState.speakingRecordings[index]?.type || "audio/webm"),
    task: step.label,
    question: step.questionText || step.promptSpeech || "Read the passage aloud.",
    passage: step.cardText || "",
    pictureStory: step.pictureStory
      ? {
          openingSentence: step.pictureStory.openingSentence,
          firstSpeech: step.pictureStory.firstSpeech,
          firstTimeLabel: step.pictureStory.firstTimeLabel,
          secondTimeLabel: step.pictureStory.secondTimeLabel,
        }
      : null,
  }));
  return `あなたは英検2級S-CBTスピーキング練習の採点者です。添付する5つの音声を、下の問題との対応を厳守して採点してください。これは学習用の非公式採点であり、英検協会の公式採点ではありません。\n\n採点対象ファイルと問題：\n${items
    .map(
      (item) =>
        `${item.order}. ${item.fileName} — ${item.task}\n質問: ${item.question}${item.passage ? `\n本文: ${item.passage}` : ""}${item.pictureStory ? `\nNo.2開始文: ${item.pictureStory.openingSentence}\n1コマ目の発言: ${item.pictureStory.firstSpeech}\n時刻表示: ${item.pictureStory.firstTimeLabel} / ${item.pictureStory.secondTimeLabel}` : ""}`,
    )
    .join("\n\n")}\n\n採点基準（各0〜5点、合計20点）：\n- 課題達成・応答の適切さ\n- 内容・情報量\n- 発音・流暢さ\n- 語彙・文法\n\n必須ルール：\n- 聞き取れない箇所を推測して補わない。「聞き取れない」と明記する。\n- 各音声について、聞き取れた回答の要約、良い点、改善点、具体的な改善例を日本語で示す。\n- 4観点それぞれの点数と根拠、合計点を示す。\n- 最後に、次回最優先で直す点を3つ示す。\n- 公式採点ではないことを結果にも明記する。`;
}

async function downloadAllGrade2SpeakingRecordings() {
  const scoredSteps = getGrade2ScoredSpeakingSteps();
  const records = [];
  for (const item of scoredSteps) {
    const blob = await getSpeakingRecordingBlob(item.index);
    if (!blob) {
      appState.speakingRecordMessage = `${item.step.label}の録音がないため、一括ダウンロードできません。`;
      saveState();
      render();
      return;
    }
    records.push({ ...item, blob });
  }
  for (const record of records) {
    const url = URL.createObjectURL(record.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = buildSpeakingRecordingFileName(record.index, record.blob.type);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    await waitForGrade2Speaking(180);
  }
  appState.speakingRecordMessage = "採点用5音声のダウンロードを開始しました。表示されない場合は、ブラウザの複数ダウンロード許可を確認するか個別ボタンを使用してください。";
  saveState();
  render();
}

function renderGrade2SpeakingReview() {
  return renderGrade2SpeakingReviewV2();
}

function renderGenericSpeakingReview() {
  const reviewItems = speakingSteps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => step.recording && step.phase !== "test-recording");

  return `
    <div class="speaking-review-list">
      ${reviewItems
        .map(({ step, index }) => {
          const recording = appState.speakingRecordings[index];
          const url = speakingRecordingUrls[index] || "";
          const promptText = step.questionText || step.openingSentence || step.promptSpeech || "";
          const evaluationPoints = Array.isArray(step.evaluationPoints) ? step.evaluationPoints.filter(Boolean) : [];
          return `
            <section class="speaking-review-item">
              <div>
                <strong>${escapeHtml(step.label || `Step ${index + 1}`)}</strong>
                <span>${recording ? formatBytes(recording.size || 0) : "録音なし"}</span>
              </div>
              ${promptText ? `<p class="speaking-review-question"><strong>Prompt</strong>${escapeHtml(promptText)}</p>` : ""}
              ${url ? `<audio controls preload="metadata" src="${url}"></audio>` : `<p>録音データがありません。</p>`}
              ${recording ? `<button class="small-action" data-action="speaking-record-download" data-step="${index}">ダウンロード</button>` : ""}
              ${
                canViewExplanations && step.modelAnswer
                  ? `<div class="speaking-review-model"><strong>解答例（比較用・完全一致不要）</strong><p>${escapeHtml(step.modelAnswer)}</p></div>`
                  : ""
              }
              ${canViewExplanations ? renderReviewExplanation(step) : ""}
              ${
                canViewExplanations && evaluationPoints.length
                  ? `
                    <div class="speaking-review-points">
                      <strong>評価ポイント</strong>
                      <ul>${evaluationPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
                    </div>
                  `
                  : ""
              }
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderGrade2SpeakingFeedbackBenefit() {
  return `
    <aside class="speaking-feedback-benefit">
      <div>
        <span class="speaking-feedback-kicker">3回プレミアム特典</span>
        <h4>録音はこの端末内に保存されています</h4>
        <p>Read AloudとNo.1〜4の「ダウンロード」から音声を保存し、上の採点パネルでコピーしたデータと一緒に利用する外部AIへ手動でアップロードしてください。マイクテストとWarm-upは採点対象外です。</p>
        <p class="speaking-feedback-note">採点は学習用の目安です。英検の公式採点・合否判定ではありません。</p>
      </div>
    </aside>
  `;
}

function getGrade2GradingPackageText() {
  const speaking = getGrade2ScoredSpeakingSteps().map(({ step, index: stepIndex }, order) => {
      const recording = appState.speakingRecordings[stepIndex] || null;
      const pictureStory = step.pictureStory
        ? {
            imageAlt: step.pictureStory.imageAlt || "",
            openingSentence: step.pictureStory.openingSentence || "",
            firstSpeech: step.pictureStory.firstSpeech || "",
            firstSpeechSpeaker: step.pictureStory.firstSpeechSpeaker || "",
            firstTimeLabel: step.pictureStory.firstTimeLabel || "",
            secondTimeLabel: step.pictureStory.secondTimeLabel || "",
          }
        : null;
      return {
        order: order + 1,
        stepIndex,
        id: step.id,
        label: step.label,
        expectedRecordingFileName: buildSpeakingRecordingFileName(stepIndex, recording?.type || "audio/webm"),
        recordingPresent: Boolean(recording),
        prompt: step.questionText || step.promptSpeech || step.prompt || "",
        passage: step.cardText || "",
        pictureStory,
        modelAnswerForComparison: step.modelAnswer || "",
      };
    });
  const gradingPackage = {
    schema: "scbt-grade2-grading-input-v1",
    setKey: selectedSet.key,
    setLabel: selectedSetLabel,
    notice: "英検2級S-CBT対策の学習用採点です。英検の公式採点、公式CSE、公式合否ではありません。CSE点や合否はAI自身が生成しません。模範解答は完全一致を求める正解ではなく、比較用の解答例です。",
    writingRubric: {
      summary: { content: "0〜4", organization: "0〜4", vocabulary: "0〜4", grammar: "0〜4", maximum: 16 },
      essay: { content: "0〜4", organization: "0〜4", vocabulary: "0〜4", grammar: "0〜4", maximum: 16 },
      totalMaximum: 32,
    },
    speakingRubric: {
      taskResponse: "0〜5",
      contentAndInformation: "0〜5",
      pronunciationAndFluency: "0〜5",
      vocabularyAndGrammar: "0〜5",
      totalMaximum: 20,
      audioRule: "Read AloudとNo.1〜4の録音だけを採点し、マイクテストとWarm-upは除外する。聞き取れない箇所は推測しない。",
    },
    writing: writingTasks.map((task) => ({
      id: task.id,
      label: task.label,
      prompt: task.lead || "",
      sourceTitle: task.sourceTitle || "",
      source: Array.isArray(task.source) ? task.source : [],
      points: Array.isArray(task.points) ? task.points : [],
      targetWords: task.targetWords || "",
      candidateAnswer: appState.writingAnswers[task.id] || "",
      modelAnswerForComparison: task.modelAnswer || "",
    })),
    speaking,
    requiredOutput: {
      explanation: "各課題・各観点の根拠、良かった点、優先改善点、改善例を日本語で説明する。",
      json: {
        schema: "scbt-grade2-gpt-score-v1",
        setKey: selectedSet.key,
        writing: {
          summary: { content: 0, organization: 0, vocabulary: 0, grammar: 0, total: 0 },
          essay: { content: 0, organization: 0, vocabulary: 0, grammar: 0, total: 0 },
          total: 0,
        },
        speaking: {
          taskResponse: 0,
          contentAndInformation: 0,
          pronunciationAndFluency: 0,
          vocabularyAndGrammar: 0,
          total: 0,
        },
      },
    },
  };
  return [
    "あなたは英検2級S-CBT対策の学習用Writing・Speaking採点者です。これは学習用の参考評価であり、英検の公式採点・公式CSE・公式合否ではありません。CSE点や合否をAI自身が生成してはいけません。",
    "",
    "【入力確認】",
    "- setKey、Writingの要約と英作文の問題・答案・比較用模範解答、Speakingの5音声がそろっているか確認してください。",
    "- 必要な答案・音声が不足している場合、架空の点数や0点の完成JSONを出さず、不足内容を先に説明してください。",
    "- 音声を直接確認できない場合、発音・流暢さを文字起こしだけから推測しないでください。聞き取れない内容も推測せず、判定困難と明記してください。",
    "- 模範解答は完全一致を求める正解ではなく、比較用です。問題の要求を満たす別の内容・構成・表現も正当に評価してください。",
    "",
    "【Speaking音声と設問の対応】",
    "採点対象はRead Aloud、No.1、No.2、No.3、No.4の5音声だけです。マイクテストとWarm-upは除外してください。アップロードされた各音声をexpectedRecordingFileNameと照合してください。対応を判断できない音声を別問題の回答として採点しないでください。不足・重複・不明なファイルがある場合は、その事実を先に示してください。",
    JSON.stringify(speaking, null, 2),
    "",
    "【Writing採点】",
    "Writingは要約と英作文を別々に採点してください。contentは課題への応答・必要情報・主張や理由、organizationは論理展開と文のつながり、vocabularyは語彙の適切さと幅、grammarは文法構造の正確さと幅を評価します。各課題はcontent、organization、vocabulary、grammarを各0〜4の整数、totalを4観点の整数合計0〜16とします。2課題合計writing.totalは0〜32で、要約と英作文のtotalの算術合計にしてください。未入力答案や必要情報が不足している答案は架空の点数を出さず、不足を説明してください。語数条件、課題への応答、必要情報、主張・理由、論理展開、語彙、語法、文法を根拠にしてください。",
    "",
    "【Speaking採点】",
    "5音声を対応づけたうえで、taskResponseは質問・指示への応答、contentAndInformationは説明・理由・情報量、pronunciationAndFluencyは聞き取りやすさ・発音・リズム・流暢さ、vocabularyAndGrammarは語彙・文法の適切さと正確さを評価します。4観点を各0〜5の整数、speaking.totalを4観点の整数合計0〜20とします。発音評価では特定の母語アクセントそのものを減点理由にせず、意味の伝達、聞き取りやすさ、語・文の区切り、強勢、速度、沈黙を評価してください。音声を聞けない場合は発音・流暢さを推測しないでください。",
    "",
    "【説明の出力順】",
    "総評、Writing要約の診断、Writing英作文の診断、Speakingの設問別診断、次回までの優先練習3項目の順に日本語で説明してください。各Writing課題は4観点の点数と本文上の根拠、良かった点を最低2点、最優先の改善点を1〜2点、元の答案を生かした改善例、語数条件の影響を示してください。Speakingは5音声それぞれの短い診断、4観点の点数と録音上の根拠、良かった点を最低2点、最優先の改善点を1〜2点、無理なく言える改善例を示してください。",
    "",
    JSON.stringify(gradingPackage, null, 2),
    "",
    "【固定JSONの出力】",
    "説明の最後に、下のrequiredOutput.jsonとキー構造を完全一致させたJSONコードブロックを1つだけ出してください。schemaを変更せず、setKeyを入力データと完全一致させ、小数・文字列の点数・分数・単位・コメント・CSE・合否を入れないでください。すべて整数とし、各totalを算術合計と一致させてください。下のJSONの0は形式見本であり、実際の確定した採点点数へ置き換えてください。入力不足、音声を直接確認できない、または点数が確定していない場合は、点数を推測せず不足を説明してJSONを出さないでください。JSONコードブロックの前後に別のJSONや説明を置かず、JSONの後には何も書かないでください。",
    "```json",
    JSON.stringify(gradingPackage.requiredOutput.json, null, 2),
    "```",
  ].join("\n");
}

const GRADE2_JSON_OUTPUT_PROMPT_TEMPLATE = `直前に行った英検2級S-CBTの学習用採点について、点数や評価内容を変更せず、CBTアプリへ取り込むためのJSONだけを再出力してください。

【絶対条件】
- 元の採点データの回次は「{{SET_KEY}}」です。setKeyを必ずこれと完全一致させてください。
- schemaは "scbt-grade2-gpt-score-v1" と完全一致させてください。
- 直前の採点で確定した点数を使い、採点し直さないでください。
- Writing要約と英作文は、content、organization、vocabulary、grammarを各0〜4の整数にしてください。
- Writing各課題のtotalは4観点の算術合計で、0〜16にしてください。
- writing.totalは要約と英作文の合計で、0〜32にしてください。
- Speakingは、taskResponse、contentAndInformation、pronunciationAndFluency、vocabularyAndGrammarを各0〜5の整数にしてください。
- speaking.totalは4観点の算術合計で、0〜20にしてください。
- 小数、文字列、分数、単位、コメントを入れないでください。
- CSE、合否、公式スコアを入れないでください。
- JSONコードブロックを1つだけ出し、その前後に説明文や別のJSONを置かないでください。
- 下の0は形式見本です。直前の採点で確定した点数へ必ず置き換えてください。
- 直前の採点結果が不足している場合、必要な音声を直接確認できていない場合、または点数が確定していない場合は、点数を推測せず、不足を説明してJSONを出さないでください。

{
  "schema": "scbt-grade2-gpt-score-v1",
  "setKey": "{{SET_KEY}}",
  "writing": {
    "summary": {
      "content": 0,
      "organization": 0,
      "vocabulary": 0,
      "grammar": 0,
      "total": 0
    },
    "essay": {
      "content": 0,
      "organization": 0,
      "vocabulary": 0,
      "grammar": 0,
      "total": 0
    },
    "total": 0
  },
  "speaking": {
    "taskResponse": 0,
    "contentAndInformation": 0,
    "pronunciationAndFluency": 0,
    "vocabularyAndGrammar": 0,
    "total": 0
  }
}`;

function getGrade2JsonOutputPrompt() {
  return GRADE2_JSON_OUTPUT_PROMPT_TEMPLATE.split("{{SET_KEY}}").join(selectedSet.key);
}

async function copyTextToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand ? document.execCommand("copy") : false;
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

async function copyGrade2GradingPackage(button) {
  const copied = await copyTextToClipboard(getGrade2GradingPackageText());
  if (button) button.textContent = copied ? "採点データをコピーしました" : "コピーできませんでした。文章を選択してください";
}

function mountGrade2SpeakingStep() {
  if (!isGrade2SpeakingExperience || !appState.started || appState.module !== "speaking") return;
  const step = speakingSteps[appState.speakingStep];
  if (!step?.autoStart || appState.speakingPhaseStatus !== "idle") return;
  const token = ++grade2SpeakingActivationToken;
  window.setTimeout(() => {
    if (token !== grade2SpeakingActivationToken) return;
    beginGrade2SpeakingStep().catch(handleGrade2SpeakingFailure);
  }, 180);
}

async function handleSpeakingDevAction(action) {
  if (!isGrade2DeveloperMode) return;

  grade2SpeakingActivationToken += 1;
  grade2SpeakingDeadline = 0;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
  stopGrade2MicrophoneCheck();

  let targetStep = appState.speakingStep;
  if (action === "speaking-dev-skip-checks") {
    const sectionStartIndex = speakingSteps.findIndex((step) => step.phase === "section-start");
    if (sectionStartIndex >= 0) targetStep = sectionStartIndex;
  } else if (action === "speaking-dev-prev") {
    targetStep = Math.max(0, targetStep - 1);
  } else if (action === "speaking-dev-next") {
    targetStep = Math.min(speakingSteps.length - 1, targetStep + 1);
  } else {
    return;
  }

  appState.speakingStep = targetStep;
  appState.speakingRemaining = getSpeakingStepSeconds(targetStep);
  appState.speakingPhaseStatus = "idle";
  appState.speakingRecordMessage = "";
  saveState();
  render();
}

async function handleGrade2SpeakingAction(action, target) {
  if (action === "grade2-speaking-continue") {
    appState.speakingBreakOpen = false;
    transitionToGrade2Module("listening");
    return;
  }

  if (action === "grade2-speaking-break") {
    appState.speakingBreakOpen = true;
    saveState();
    render();
    return;
  }

  if (action === "grade2-speaking-resume") {
    appState.speakingBreakOpen = false;
    transitionToGrade2Module("listening");
    return;
  }

  if (action === "grade2-speaking-download-all") {
    await downloadAllGrade2SpeakingRecordings();
    return;
  }

  if (action === "grade2-speaking-copy-grading-prompt") {
    const copied = await copyTextToClipboard(getGrade2SpeakingGradingPrompt());
    appState.speakingRecordMessage = copied
      ? "スピーキング単体のAI振り返り用プロンプトをコピーしました。5つの音声と一緒に貼り付けてください。最終JSONは4技能終了後の結果画面で作成します。"
      : "コピーできませんでした。文章を選択してコピーしてください。";
    saveState();
    render();
    return;
  }

  if (action === "grade2-speaking-next") {
    await advanceGrade2SpeakingStep();
    return;
  }

  if (action === "grade2-speaking-output-test") {
    appState.speakingRecordMessage = "確認音声を再生しています。";
    saveState();
    render();
    await speakGrade2Prompt(
      "This is a sound check. Please adjust the volume to a comfortable level.",
      getGrade2SpeakingAudioUrl("common", "sound-check"),
    );
    appState.speakingRecordMessage = "音量を確認できたら次へ進んでください。";
    saveState();
    render();
    return;
  }

  if (action === "grade2-speaking-mic-check") {
    const ready = await startGrade2MicrophoneCheck();
    appState.speakingMicReady = ready;
    saveState();
    render();
    return;
  }

  if (action === "grade2-speaking-test-record") {
    stopGrade2MicrophoneCheck();
    appState.speakingPhaseStatus = "prompting";
    appState.speakingRecordMessage = "録音を開始します。";
    saveState();
    render();
    await waitForGrade2Speaking(450);
    const started = await startSpeakingRecording({ renderAfter: false });
    if (!started) {
      appState.speakingPhaseStatus = "error";
      saveState();
      render();
      return;
    }
    startGrade2SpeakingTimer(5, "recording");
    return;
  }

  if (action === "grade2-speaking-test-retry") {
    const testIndex = speakingSteps.findIndex((step) => step.id === "test-recording");
    appState.speakingStep = Math.max(0, testIndex);
    appState.speakingPhaseStatus = "idle";
    appState.speakingTestConfirmed = false;
    appState.speakingRecordMessage = "";
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
    saveState();
    render();
    return;
  }

  if (action === "grade2-speaking-test-confirm") {
    appState.speakingTestConfirmed = true;
    await advanceGrade2SpeakingStep();
    return;
  }

  if (action === "grade2-speaking-start-exam") {
    await advanceGrade2SpeakingStep();
    return;
  }

  if (action === "grade2-speaking-begin") {
    await beginGrade2SpeakingStep();
    return;
  }

  if (action === "grade2-speaking-choice") {
    const choice = target.dataset.choice === "no" ? "no" : "yes";
    await startGrade2ChoiceRecording(choice);
    return;
  }

  if (action === "grade2-speaking-finish-answer") {
    await advanceGrade2SpeakingStep();
    return;
  }

  if (action === "grade2-speaking-replay") {
    await replayGrade2SpeakingQuestion();
  }
}

async function beginGrade2SpeakingStep({ replay = false } = {}) {
  const stepIndex = appState.speakingStep;
  const step = speakingSteps[stepIndex];
  if (!step || (!replay && appState.speakingPhaseStatus !== "idle")) return;

  const token = ++grade2SpeakingActivationToken;
  appState.speakingPhaseStatus = "prompting";
  appState.speakingRecordMessage = "案内・質問音声を聞いてください。";
  saveState();
  render();

  let speech = step.promptSpeech || "";
  const savedChoice = appState.speakingChoices[step.id];
  await speakGrade2Prompt(speech, step.promptAudioFile);
  if (replay && step.requiresChoice && savedChoice) {
    await waitForGrade2Speaking(350);
    await speakGrade2Prompt(
      savedChoice === "yes" ? "Why?" : "Why not?",
      getGrade2SpeakingAudioUrl("common", savedChoice === "yes" ? "why" : "why-not"),
    );
  }
  await waitForGrade2Speaking(650);
  if (token !== grade2SpeakingActivationToken || appState.speakingStep !== stepIndex) return;

  if (step.requiresChoice && !savedChoice) {
    appState.speakingPhaseStatus = "awaiting-choice";
    appState.speakingRecordMessage = "Yes または No を選んでください。";
    saveState();
    render();
    return;
  }

  if (step.recording) {
    await startGrade2RecordingForCurrentStep();
    return;
  }

  if (step.timed) {
    startGrade2SpeakingTimer(step.seconds, "counting");
    return;
  }

  await advanceGrade2SpeakingStep();
}

async function startGrade2ChoiceRecording(choice) {
  const stepIndex = appState.speakingStep;
  const step = speakingSteps[stepIndex];
  if (!step?.requiresChoice || appState.speakingPhaseStatus !== "awaiting-choice") return;
  appState.speakingChoices[step.id] = choice;
  appState.speakingPhaseStatus = "prompting";
  appState.speakingRecordMessage = `${choice === "yes" ? "Yes" : "No"} を選択しました。続く質問を聞いてください。`;
  saveState();
  render();
  const token = ++grade2SpeakingActivationToken;
  await speakGrade2Prompt(
    choice === "yes" ? "Why?" : "Why not?",
    getGrade2SpeakingAudioUrl("common", choice === "yes" ? "why" : "why-not"),
  );
  await waitForGrade2Speaking(650);
  if (token !== grade2SpeakingActivationToken || appState.speakingStep !== stepIndex) return;
  await startGrade2RecordingForCurrentStep();
}

async function startGrade2RecordingForCurrentStep() {
  stopGrade2MicrophoneCheck();
  const started = await startSpeakingRecording({ renderAfter: false });
  if (!started) {
    appState.speakingPhaseStatus = "error";
    saveState();
    render();
    return;
  }
  const step = speakingSteps[appState.speakingStep];
  startGrade2SpeakingTimer(step.seconds, "recording");
}

function startGrade2SpeakingTimer(seconds, status) {
  const safeSeconds = Math.max(1, Number(seconds) || 1);
  grade2SpeakingDeadline = performance.now() + safeSeconds * 1000;
  appState.speakingRemaining = safeSeconds;
  appState.speakingPhaseStatus = status;
  appState.speakingRecordMessage = status === "recording" ? "録音中です。話し終わった場合は「回答を終える」を押せます。" : "時間が終わると自動的に次へ進みます。";
  saveState();
  render();
}

async function replayGrade2SpeakingQuestion() {
  const step = speakingSteps[appState.speakingStep];
  const replayLimit = Number(step?.replayLimit) || 0;
  const replayCount = Number(appState.speakingReplayCounts[step?.id]) || 0;
  if (!step || replayCount >= replayLimit || grade2SpeakingAdvanceInProgress) return;
  grade2SpeakingAdvanceInProgress = true;
  grade2SpeakingActivationToken += 1;
  if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
  appState.speakingReplayCounts[step.id] = replayCount + 1;
  appState.speakingPhaseStatus = "idle";
  appState.speakingRemaining = step.seconds;
  grade2SpeakingDeadline = 0;
  saveState();
  render();
  grade2SpeakingAdvanceInProgress = false;
  await beginGrade2SpeakingStep({ replay: true });
}

async function advanceGrade2SpeakingStep() {
  if (grade2SpeakingAdvanceInProgress) return;
  grade2SpeakingAdvanceInProgress = true;
  grade2SpeakingActivationToken += 1;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
  stopGrade2MicrophoneCheck();
  grade2SpeakingDeadline = 0;
  if (appState.speakingStep < speakingSteps.length - 1) appState.speakingStep += 1;
  appState.speakingPhaseStatus = "idle";
  appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  appState.speakingRecordMessage = "";
  saveState();
  render();
  grade2SpeakingAdvanceInProgress = false;
}

async function startGrade2MicrophoneCheck() {
  if (!navigator.mediaDevices?.getUserMedia) {
    appState.speakingMicMessage = "このブラウザではマイクを確認できません。ChromeまたはEdgeで開いてください。";
    return false;
  }
  try {
    stopGrade2MicrophoneCheck();
    speakingMicCheckStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    await startSpeakingLevelMonitor(speakingMicCheckStream);
    appState.speakingMicMessage = "マイクを確認できました。メーターが動くことを確かめてください。";
    return true;
  } catch (error) {
    stopGrade2MicrophoneCheck();
    appState.speakingMicMessage = "マイクを使用できません。ブラウザのマイク許可と接続を確認してください。";
    return false;
  }
}

function stopGrade2MicrophoneCheck() {
  if (speakingMicCheckStream) speakingMicCheckStream.getTracks().forEach((track) => track.stop());
  speakingMicCheckStream = null;
  stopSpeakingLevelMonitor();
}

function selectGrade2SpeakingOutputVoice(voices) {
  const englishVoices = voices.filter((voice) => /^en/i.test(voice.lang || ""));
  const candidates = englishVoices.length ? englishVoices : voices;
  for (const preferredName of GRADE2_SPEAKING_OUTPUT_VOICE_PREFERENCES) {
    const preferred = candidates.find((voice) => (voice.name || "").toLowerCase().includes(preferredName.toLowerCase()));
    if (preferred) return preferred;
  }
  return candidates.find((voice) => /^en-US/i.test(voice.lang || "")) || candidates.find((voice) => /^en/i.test(voice.lang || "")) || null;
}

function getGrade2SpeakingVoices() {
  if (!("speechSynthesis" in window)) return Promise.resolve([]);
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) return Promise.resolve(voices);
  return new Promise((resolve) => {
    const finish = () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", finish, { once: true });
    window.setTimeout(finish, 600);
  });
}

async function startSpeakingLevelMonitor(stream) {
  stopSpeakingLevelMonitor();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass || !stream) return;
  speakingAudioContext = new AudioContextClass();
  if (speakingAudioContext.state === "suspended") await speakingAudioContext.resume();
  speakingAnalyser = speakingAudioContext.createAnalyser();
  speakingAnalyser.fftSize = 1024;
  speakingAnalyser.smoothingTimeConstant = 0.78;
  speakingAudioContext.createMediaStreamSource(stream).connect(speakingAnalyser);
  const samples = new Uint8Array(speakingAnalyser.fftSize);

  const draw = () => {
    if (!speakingAnalyser) return;
    speakingAnalyser.getByteTimeDomainData(samples);
    let sum = 0;
    for (const sample of samples) {
      const value = (sample - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / samples.length);
    const level = Math.max(0, Math.min(100, Math.round(rms * GRADE2_SPEAKING_MIC_LEVEL_GAIN)));
    const fill = app.querySelector(".speaking-level-fill");
    const meter = app.querySelector(".speaking-level-track");
    if (fill) fill.style.width = `${level}%`;
    if (meter) meter.setAttribute("aria-valuenow", String(level));
    speakingMeterFrame = requestAnimationFrame(draw);
  };
  draw();
}

function stopSpeakingLevelMonitor() {
  if (speakingMeterFrame) cancelAnimationFrame(speakingMeterFrame);
  speakingMeterFrame = null;
  speakingAnalyser = null;
  if (speakingAudioContext && speakingAudioContext.state !== "closed") speakingAudioContext.close().catch(() => {});
  speakingAudioContext = null;
}

function playGrade2SpeakingAudioPrompt(audioUrl) {
  if (!audioUrl) return Promise.reject(new Error("missing audio URL"));
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    audio.volume = getGrade2OutputVolume();
    audio.addEventListener("ended", resolve, { once: true });
    audio.addEventListener("error", reject, { once: true });
    const playResult = audio.play();
    if (playResult && typeof playResult.catch === "function") playResult.catch(reject);
  });
}

async function speakGrade2Prompt(text, audioUrl = "") {
  const speechText = String(text || "").trim();
  if (audioUrl) {
    try {
      await playGrade2SpeakingAudioPrompt(audioUrl);
      return;
    } catch {
      // Fall back to browser TTS if the local audio file cannot be played.
    }
  }
  if (!speechText || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    return waitForGrade2Speaking(500);
  }
  const voices = await getGrade2SpeakingVoices();
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.voice = selectGrade2SpeakingOutputVoice(voices);
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = getGrade2OutputVolume();
    utterance.addEventListener("end", resolve, { once: true });
    utterance.addEventListener("error", resolve, { once: true });
    window.speechSynthesis.speak(utterance);
  });
}

function waitForGrade2Speaking(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function handleGrade2SpeakingFailure() {
  appState.speakingPhaseStatus = "error";
  appState.speakingRecordMessage = "処理を続けられませんでした。マイク許可を確認して、もう一度お試しください。";
  saveState();
  render();
}

function renderPre1SpeakingCard(step) {
  const pictureCues = Array.isArray(step.pictureCues) ? step.pictureCues : [];
  return `
    <article class="pre1-speaking-card">
      <div class="pre1-story-eyebrow">Grade Pre-1 Speaking Card</div>
      <h3>${escapeHtml(step.storyTitle || "Narration")}</h3>
      ${step.storyLead ? `<p class="pre1-story-lead">${escapeHtml(step.storyLead)}</p>` : ""}
      ${
        step.openingSentence
          ? `<p class="pre1-story-opening"><span>Start your narration with this sentence:</span><strong>${escapeHtml(step.openingSentence)}</strong></p>`
          : ""
      }
      <figure class="pre1-story-figure">
        <img src="${escapeHtml(step.pictureImageSrc)}" alt="${escapeHtml(step.pictureAlt || "Four-panel speaking card")}" />
      </figure>
      ${
        pictureCues.length
          ? `
            <div class="pre1-story-cues" aria-label="Picture sequence">
              ${pictureCues
                .map(
                  (cue, index) => `
                    <div class="pre1-story-cue">
                      <strong>${index + 1}. ${escapeHtml(cue.time || "")}</strong>
                      ${cue.text ? `<span>“${escapeHtml(cue.text)}”</span>` : ""}
                    </div>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
    </article>
  `;
}

function renderSpeakingVisual(step) {
  if (step.pictureImageSrc) {
    return renderPre1SpeakingCard(step);
  }

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
        <button class="small-action speaking-prompt-play" data-action="speaking-prompt-play">▶ 面接官の音声を再生</button>
      </div>
    `);
  } else if (step.promptSpeech) {
    blocks.push(`
      <div class="speaking-material speaking-audio-prompt">
        <button class="small-action speaking-prompt-play" data-action="speaking-prompt-play">▶ 試験音声を再生</button>
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
          <p>「採点する」を押すと選択式問題の素点を計算し、回答解説モードへ進みます。未解答の問題や見直したい問題が残っている場合は、「戻る」を押してください。</p>
          <div class="modal-actions">
            <button data-action="complete-exam">採点する</button>
            <button data-action="close-modal">戻る</button>
          </div>
        </div>
      </div>
    `;
  }

  if (appState.modal === "full") {
    const task = writingTasks[appState.writingTask] || writingTasks[0];
    return `
      <div class="modal-backdrop writing-full-backdrop">
        <div class="full-modal writing-full-modal">
          <button class="modal-close" data-action="close-modal">×</button>
          <div class="writing-full-scroll">
            <div class="email-card">
              ${task.sourceTitle ? `<strong>${escapeHtml(task.sourceTitle)}</strong>` : ""}
              ${task.source.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
            </div>
            ${renderWritingPoints(task)}
          </div>
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
  const resultContent = isGrade2Product ? renderGrade2ScoreResult(summary) : renderLegacyScoreResult(summary);
  return `
    <section class="start-screen result-screen">
      ${renderDeveloperToolbar()}
      <div class="start-title">試験終了</div>
      ${resultContent}
      ${renderReviewBoard()}
      <button class="start-button" data-action="restart">最初に戻る</button>
    </section>
  `;
}

function renderLegacyScoreResult(summary) {
  return `
    <div class="result-grid">
      <article class="result-card"><span>リーディング</span><strong>${summary.reading.correct}/${summary.reading.total}</strong><small>未解答 ${summary.reading.unanswered} 問</small></article>
      <article class="result-card"><span>リスニング</span><strong>${summary.listening.correct}/${summary.listening.total}</strong><small>未解答 ${summary.listening.unanswered} 問</small></article>
      <article class="result-card"><span>ライティング</span><strong>${summary.writing.answered}/${summary.writing.total}</strong><small>入力済みタスク数</small></article>
      <article class="result-card"><span>全体状況</span><strong>${summary.answered}/${summary.total}</strong><small>未解答 ${summary.unanswered} 問 / 見直し ${summary.reviewed} 問</small></article>
    </div>
  `;
}

function getValidatedGrade2GptScores() {
  if (!grade2Scoring || !appState.grade2GptScores) return null;
  const validation = grade2Scoring.validateGptScorePayload(appState.grade2GptScores, selectedSet.key);
  return validation.ok ? validation.value : null;
}

function renderGrade2ScoreResult(summary) {
  if (!grade2Scoring) {
    return `<p class="grading-message error">採点処理を読み込めませんでした。ページを再読み込みしてください。</p>`;
  }
  const gptScores = getValidatedGrade2GptScores();
  const scoreView = grade2Scoring.summarizeScores({ reading: summary.reading, listening: summary.listening, gptScores });
  return `
    <section class="grade2-score-board" aria-label="採点結果">
      <div class="score-board-heading">
        <div><span>採点結果</span><h2>素点を中心に確認</h2></div>
        <strong>英検公式スコア・公式合否ではありません</strong>
      </div>
      <div class="result-grid grade2-raw-score-grid">
        <article class="result-card primary-score"><span>1. Reading 素点</span><strong>${summary.reading.correct}/${summary.reading.total}</strong><small>未解答 ${summary.reading.unanswered} 問</small></article>
        <article class="result-card primary-score"><span>2. Listening 素点</span><strong>${summary.listening.correct}/${summary.listening.total}</strong><small>未解答 ${summary.listening.unanswered} 問</small></article>
        <article class="result-card combined-score"><span>3. Reading＋Listening</span><strong>${scoreView.readingListening.raw}/${scoreView.readingListening.maximum}</strong><small>選択式の合計素点</small></article>
        <article class="result-card ${gptScores ? "gpt-scored" : "gpt-pending"}"><span>4. Writing</span><strong>${gptScores ? `${gptScores.writing.total}/32` : "AI採点待ち"}</strong><small>${gptScores ? `要約 ${gptScores.writing.summary.total}/16・英作文 ${gptScores.writing.essay.total}/16` : "採点JSONを下へ貼り付け"}</small></article>
        <article class="result-card ${gptScores ? "gpt-scored" : "gpt-pending"}"><span>5. Speaking</span><strong>${gptScores ? `${gptScores.speaking.total}/20` : "AI採点待ち"}</strong><small>${gptScores ? "学習用4観点の素点" : "Read Aloud・No.1〜4を採点"}</small></article>
      </div>
      ${gptScores ? renderGrade2CseRanges(scoreView) : `<p class="score-pending-note">WritingとSpeakingのAI採点JSONを取り込むと、4技能の練習用CSEレンジと合格レベル目安を表示します。</p>`}
    </section>
    ${renderGrade2GptPanel(gptScores)}
    <div class="result-review-actions">
      <button class="small-action" data-action="listen-review-open">リスニングを個別復習する</button>
    </div>
  `;
}

function formatCseRange(range) {
  return range ? `${range.low}〜${range.high}` : "—";
}

function renderGrade2CseRanges(scoreView) {
  return `
    <section class="cse-estimate-panel ${escapeHtml(scoreView.level.key)}">
      <div class="cse-estimate-head">
        <div><span>非公式・練習用CSE目安</span><strong>${escapeHtml(scoreView.level.label)}</strong></div>
        <small>素点率の帯から算出した重なりのある概算レンジ</small>
      </div>
      <div class="cse-range-grid">
        <div><span>Reading</span><strong>${formatCseRange(scoreView.reading)}</strong></div>
        <div><span>Listening</span><strong>${formatCseRange(scoreView.listening)}</strong></div>
        <div><span>Writing</span><strong>${formatCseRange(scoreView.writing)}</strong></div>
        <div><span>Speaking</span><strong>${formatCseRange(scoreView.speaking)}</strong></div>
        <div class="wide"><span>一次 R＋L＋W</span><strong>${formatCseRange(scoreView.primary)}</strong><small>基準1520点との位置関係</small></div>
        <div class="wide"><span>4技能総合</span><strong>${formatCseRange(scoreView.overall)}</strong><small>総合1980点だけでは合否判定しません</small></div>
      </div>
      <p>一次レンジとSpeakingレンジを別々に基準と比較しています。公式CSEはIRTによって算出されるため、正答数から正確には換算できません。<a href="https://www.eiken.or.jp/cse/index.html" target="_blank" rel="noopener">英検CSEの公式説明</a> / <a href="https://www.eiken.or.jp/eiken/result/eiken-cse_admission.html" target="_blank" rel="noopener">公式の合否判定方法</a></p>
    </section>
  `;
}

function renderGrade2GptPanel(gptScores) {
  const messageClass = appState.grade2GptScoreMessage.includes("取り込みました") ? "success" : "error";
  const dedicatedAiAction = GRADE2_GRADING_GPT_URL
    ? `<a class="small-action" href="${escapeHtml(GRADE2_GRADING_GPT_URL)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">専用採点AIを開く</a>`
    : `<span class="speaking-feedback-pending">${canViewBonus ? "専用採点AIは未設定です。下の外部AI選択をご利用ください。" : "専用採点AIは現在設定されていません。"}</span>`;
  const premiumActions = `
        ${dedicatedAiAction}
        ${
          canViewBonus
            ? `
        <button class="small-action" data-action="copy-grade2-grading-data">採点データをコピー</button>
        <a class="small-action" href="${GRADE2_EXTERNAL_AI_GRADING_URL}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">普段使っているAIを選ぶ</a>
        <button class="small-action" data-action="copy-grade2-json-output-prompt">JSONが出なかったときの指示をコピー</button>
      `
            : `<p class="speaking-feedback-pending">外部AI採点は3回プレミアム・5回プレミアムで利用できます。</p>`
        }
      `;
  return `
    <section class="grade2-gpt-panel" aria-label="外部AI採点連携">
      <div class="grade2-gpt-head">
        <div><span>3回プレミアム</span><h2>Writing・Speaking 外部AI採点</h2></div>
        ${gptScores ? `<strong class="gpt-imported-badge">採点JSON取込済み</strong>` : `<strong class="gpt-pending-badge">AI採点待ち</strong>`}
      </div>
      <ol class="gpt-grading-steps">
        <li>「採点データをコピー」でWriting問題・答案・比較用解答例・Speaking質問・採点基準をコピーします。</li>
        <li>Read AloudとNo.1〜4の録音を下の復習欄から保存し、利用するAIへ手動でアップロードします。マイクテストとWarm-upは対象外です。</li>
        <li>AIが返した説明の末尾にあるJSONを、コードブロックごと下へ貼り付けます。結果画面は閉じずに残してください。</li>
      </ol>
      <div class="grade2-gpt-actions">${premiumActions}</div>
      ${canViewBonus ? `<p class="gpt-keep-open-note">この結果画面は閉じずに残してください。AIでJSONをコピーしたら、このタブへ戻して貼り付けます。</p>` : ""}
      <label class="gpt-json-input">
        <span>AIの採点結果JSON</span>
        <textarea data-grade2-gpt-score-draft spellcheck="false" placeholder="説明文やJSONコードブロックを含むAIの回答を、そのまま貼り付けてください。">${escapeHtml(appState.grade2GptScoreDraft)}</textarea>
      </label>
      <button class="start-button compact" data-action="import-grade2-gpt-score">採点JSONを取り込む</button>
      ${appState.grade2GptScoreMessage ? `<div class="grading-message ${messageClass}">${escapeHtml(appState.grade2GptScoreMessage)}</div>` : ""}
      <p class="gpt-model-note">模範解答は完全一致を要求する正解ではなく、内容・構成・表現を比較するための解答例です。貼り戻した素点からCSE目安を再計算し、AI独自のCSE判断は使いません。</p>
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
        <div>
          <h2>回答解説モード</h2>
          ${canViewExplanations && selectedSet.explanationPackage ? `<span class="review-premium-badge">${escapeHtml(selectedSet.explanationPackage.label)}</span>` : ""}
        </div>
        <span>${canViewExplanations ? "問題を開くと、自分の解答・正答・全選択肢・根拠・誤答理由・学習ポイントを確認できます。" : "正答・誤答・未解答を確認できます。"}</span>
      </div>
      <p class="review-model-note">Writing・Speakingの模範解答は完全一致を要求する正解ではなく、比較用の解答例です。</p>
      ${canViewExplanations ? "" : `<p class="review-plan-note">この版では答え合わせのみです。詳しい解説、スクリプト、模範解答は3回プレミアムに含まれます。</p>`}
      <div class="review-filter-bar" aria-label="復習フィルター">
        ${renderReviewFilterButton("all", "すべて")}
        ${renderReviewFilterButton("wrong", "不正解")}
        ${renderReviewFilterButton("unanswered", "未解答")}
        ${renderReviewFilterButton("marked", "見直し")}
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
        ${
          speakingSteps.some((step) => step.recording)
            ? `
              <section class="review-speaking-section">
                <h3>スピーキング</h3>
                ${renderGenericSpeakingReview()}
                ${isGrade2SpeakingExperience && selectedAccessPlan.key === "three" ? renderGrade2SpeakingFeedbackBenefit() : ""}
              </section>
            `
            : ""
        }
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
        ${renderReviewExplanation(question)}
        ${canViewExplanations && type === "listening" && question.script ? `<p class="review-script"><strong>Script</strong>${escapeHtml(question.script)}</p>` : ""}
      </div>
    </details>
  `;
}

function renderReviewExplanation(item) {
  if (!canViewExplanations) return "";
  const explanation = String(item?.explanation || "").trim();
  const fallbackStudyPoint = /【学習ポイント】/.test(explanation) ? "" : getFallbackStudyPoint(item);
  const studyPoint = String(item?.studyPoint || fallbackStudyPoint).trim();
  if (!explanation && !studyPoint) return "";

  const title = item?.explanationTier === "premium" ? "購入特典・詳しい解説" : "解説";
  const sections = explanation
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^【([^】]+)】\s*(.*)$/);
      if (!match) return `<p>${escapeHtml(line)}</p>`;
      return `
        <section class="review-explanation-section">
          <strong>${escapeHtml(match[1])}</strong>
          <p>${escapeHtml(match[2])}</p>
        </section>
      `;
    })
    .join("");

  return `
    <div class="review-explanation ${item?.explanationTier === "premium" ? "is-premium" : ""}">
      <div class="review-explanation-title">${escapeHtml(title)}</div>
      ${sections}
      ${
        studyPoint
          ? `
            <section class="review-takeaway">
              <strong>今回の学習ポイント</strong>
              <p>${escapeHtml(studyPoint)}</p>
            </section>
          `
          : ""
      }
    </div>
  `;
}

function getFallbackStudyPoint(item) {
  if (!Array.isArray(item?.choices) || item.choices.length === 0) return "";
  if (item?.part === "Part 1") {
    return "疑問詞と最後のやり取りを結び付け、話者・行動・時刻を取り違えないように聞き取る。";
  }
  if (item?.part === "Part 2") {
    return "質問で問われる人物・理由・結果に絞り、放送内容を言い換えた選択肢を探す。";
  }
  if (item?.type === "vocabulary" || item?.section === "短文語句") {
    return "空所前後の文脈を先に捉え、4択それぞれの意味と語法を照合する。";
  }
  return "設問のキーワードと本文の根拠文を照合し、本文にない言い過ぎを含む選択肢を除く。";
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
        ${canViewExplanations ? renderWritingReviewChecklist(task) : ""}
        ${renderReviewExplanation(task)}
        ${
          canViewExplanations && task.modelAnswer
            ? `<div class="review-model-answer"><strong>模範解答例（比較用・完全一致不要）</strong><p>${escapeHtml(task.modelAnswer)}</p></div>`
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
          .map((item, index) => `<li class="${checkedItems[index] ? "checked" : ""}">${checkedItems[index] ? "✓" : "-"} ${escapeHtml(item)}</li>`)
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

function syncDeveloperLocationUrl() {
  if (!isGrade2DeveloperMode || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("dev", "1");
  url.searchParams.set("start", "1");
  url.searchParams.delete("started");
  url.searchParams.delete("question");
  url.searchParams.delete("listen");
  url.searchParams.delete("speakingStep");
  url.searchParams.delete("writingTask");
  url.searchParams.delete("readingPage");
  url.searchParams.delete("result");
  if (appState.modal === "complete") {
    url.searchParams.set("module", appState.module);
    url.searchParams.set("result", "1");
  } else {
    url.searchParams.set("module", appState.module);
    if (appState.module === "speaking") url.searchParams.set("speakingStep", String(appState.speakingStep));
    if (appState.module === "listening") url.searchParams.set("question", String(listeningQuestions[appState.listeningIndex]?.id || 1));
    if (appState.module === "reading") {
      const page = readingPages[appState.readingPage];
      const question = page?.questions?.[getCurrentReadingItemIndex(page)];
      if (question) url.searchParams.set("question", String(question.id));
    }
    if (appState.module === "writing") url.searchParams.set("question", String(writingTasks[appState.writingTask]?.id || 1));
  }
  window.history.replaceState(null, "", url.toString());
}

function moveToDeveloperLocation(value) {
  if (!isGrade2DeveloperMode) return;
  const parts = String(value || "").split(":");
  const moduleKey = parts[0];
  stopListeningPlayback();
  grade2SpeakingActivationToken += 1;
  grade2SpeakingDeadline = 0;
  appState.started = true;
  appState.modal = null;

  if (moduleKey === "result") {
    appState.scored = true;
    appState.modal = "complete";
  } else if (moduleKey === "speaking" && isModuleAvailable("speaking")) {
    appState.module = "speaking";
    appState.speakingStep = Math.min(Math.max(Number(parts[1]) || 0, 0), speakingSteps.length - 1);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
    appState.speakingPhaseStatus = "idle";
  } else if (moduleKey === "listening" && isModuleAvailable("listening")) {
    appState.module = "listening";
    appState.listeningIndex = Math.min(Math.max(Number(parts[1]) || 0, 0), listeningQuestions.length - 1);
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (moduleKey === "reading" && isModuleAvailable("reading")) {
    appState.module = "reading";
    appState.readingPage = Math.min(Math.max(Number(parts[1]) || 0, 0), readingPages.length - 1);
    const page = readingPages[appState.readingPage];
    const questionIndex = Math.min(Math.max(Number(parts[2]) || 0, 0), Math.max(0, (page?.questions?.length || 1) - 1));
    const step = getReadingStepSize(page);
    appState.readingItemIndex = Math.floor(questionIndex / step) * step;
    appState.drawerOpen = false;
  } else if (moduleKey === "writing" && isModuleAvailable("writing")) {
    appState.module = "writing";
    appState.writingTask = Math.min(Math.max(Number(parts[1]) || 0, 0), writingTasks.length - 1);
  } else {
    return;
  }

  saveState();
  syncDeveloperLocationUrl();
  render();
}

function exitDeveloperMode() {
  if (!isGrade2DeveloperMode) return;
  resetState();
  const url = new URL(window.location.href);
  ["dev", "module", "question", "listen", "speakingStep", "writingTask", "readingPage", "result", "start", "started", "fresh"].forEach((key) => url.searchParams.delete(key));
  window.location.assign(url.toString());
}

function importGrade2GptScore() {
  if (!grade2Scoring) {
    appState.grade2GptScoreMessage = "採点処理を読み込めませんでした。ページを再読み込みしてください。";
    return false;
  }
  const result = grade2Scoring.parseAndValidateGptScore(appState.grade2GptScoreDraft, selectedSet.key);
  if (!result.ok) {
    appState.grade2GptScoreMessage = `取り込めませんでした：${result.errors.join(" / ")}`;
    return false;
  }
  appState.grade2GptScores = result.value;
  appState.grade2GptScoreMessage = "採点JSONを取り込みました。素点と練習用CSE目安を再計算しました。";
  return true;
}

async function handleClick(event) {
  const target = event.target.closest("button");
  if (!target) return;

  if (target.dataset.grade) {
    if (isGradeLocked) return;
    try {
      localStorage.setItem(GRADE_SELECTION_KEY, target.dataset.grade);
    } catch {
      // Continue with the reload even if local storage is unavailable.
    }
    window.location.reload();
    return;
  }

  if (target.dataset.set) {
    const nextSetKey = normalizeSetKey(target.dataset.set);
    try {
      localStorage.setItem(getSetSelectionKey(selectedGrade), nextSetKey);
    } catch {
      // Continue with the reload even if local storage is unavailable.
    }
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("set", nextSetKey);
    nextUrl.searchParams.delete("setKey");
    nextUrl.searchParams.set("module", isGrade2ContinuousExam ? "speaking" : appState.module);
    nextUrl.searchParams.set("start", isGrade2ContinuousExam ? "1" : "0");
    if (isGrade2ContinuousExam) nextUrl.searchParams.set("fresh", "1");
    nextUrl.searchParams.delete("started");
    nextUrl.searchParams.delete("speakingStep");
    nextUrl.searchParams.delete("question");
    nextUrl.searchParams.delete("listen");
    window.location.assign(nextUrl.toString());
    return;
  }

  if (target.dataset.devSet) {
    if (!isGrade2DeveloperMode) return;
    const nextSetKey = normalizeSetKey(target.dataset.devSet);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("set", nextSetKey);
    nextUrl.searchParams.set("dev", "1");
    nextUrl.searchParams.set("module", "speaking");
    nextUrl.searchParams.set("speakingStep", "0");
    nextUrl.searchParams.set("start", "1");
    nextUrl.searchParams.set("fresh", "1");
    nextUrl.searchParams.delete("result");
    nextUrl.searchParams.delete("question");
    window.location.assign(nextUrl.toString());
    return;
  }

  if (target.dataset.devModule) {
    if (!isGrade2DeveloperMode || !isModuleAvailable(target.dataset.devModule)) return;
    moveToDeveloperLocation(`${target.dataset.devModule}:0`);
    return;
  }

  if (target.dataset.module) {
    if (isGrade2ContinuousExam) return;
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

  if (action.startsWith("speaking-dev-")) {
    await handleSpeakingDevAction(action);
    return;
  }

  if (isGrade2SpeakingExperience && action.startsWith("grade2-speaking-")) {
    await handleGrade2SpeakingAction(action, target);
    return;
  }

  if (action === "start") {
    if (isGrade2SpeakingExperience && appState.module === "speaking") {
      grade2SpeakingActivationToken += 1;
      grade2SpeakingDeadline = 0;
      appState.speakingStep = 0;
      appState.speakingPhaseStatus = "idle";
      appState.speakingRemaining = getSpeakingStepSeconds(0);
      appState.speakingReplayCounts = {};
      appState.speakingChoices = {};
      appState.speakingBreakOpen = false;
      appState.speakingMicReady = false;
      appState.speakingMicMessage = "";
      appState.speakingTestConfirmed = false;
      appState.speakingRecordMessage = "";
    }
    appState.started = true;
    prepareModuleStart();
    if (isGrade2ContinuousExam) syncGrade2ModuleUrl(appState.module, { started: true });
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
  } else if (action === "copy-grade2-grading-data" || action === "copy-speaking-feedback-prompt") {
    await copyGrade2GradingPackage(target);
    return;
  } else if (action === "copy-grade2-json-output-prompt") {
    const copied = await copyTextToClipboard(getGrade2JsonOutputPrompt());
    target.textContent = copied ? "JSON再出力の指示をコピーしました" : "コピーできませんでした。文章を選択してください";
    return;
  } else if (action === "import-grade2-gpt-score") {
    importGrade2GptScore();
  } else if (action === "dev-result") {
    moveToDeveloperLocation("result");
    return;
  } else if (action === "dev-exit") {
    exitDeveloperMode();
    return;
  } else if (action === "toggle-drawer") {
    appState.drawerOpen = !appState.drawerOpen;
  } else if (action === "toggle-instruction") {
    appState.instructionOpen = !appState.instructionOpen;
  } else if (action === "increase-font") {
    appState.fontLevel = Math.min(FONT_LEVEL_MAX, (Number(appState.fontLevel) || 1) + 1);
  } else if (action === "show-finish" || (action === "writing-next" && appState.writingTask === writingTasks.length - 1)) {
    appState.modal = "finish";
  } else if (action === "complete-exam") {
    appState.scored = true;
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
      if (isGrade2ContinuousExam) {
        transitionToGrade2Module("writing", { resetWrittenTimer: false });
        return;
      }
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
    await playListeningAudio({ force: appState.listeningReviewMode });
    return;
  } else if (action === "listen-review-open") {
    stopListeningPlayback();
    appState.module = "listening";
    appState.started = true;
    appState.modal = null;
    appState.listeningReviewMode = true;
    appState.listeningIndex = 0;
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
    listeningPlaybackPhase = "review";
    syncGrade2ModuleUrl("listening", { started: true });
  } else if (action === "listen-review-close") {
    stopListeningPlayback();
    appState.listeningReviewMode = false;
    appState.modal = "complete";
  } else if (action === "listen-replay-dev") {
    await replayListeningAudioForDeveloper();
    return;
  } else if (action === "listen-current") {
    app.querySelector(".listen-question")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  } else if (action === "listen-next") {
    if (isGrade2ContinuousExam && !isGrade2DeveloperMode) return;
    if (appState.listeningIndex >= listeningQuestions.length - 1) {
      if (appState.listeningReviewMode) return;
      if (isGrade2ContinuousExam) {
        transitionToGrade2Module("reading");
        return;
      }
      appState.modal = "complete";
    } else {
      appState.listeningIndex += 1;
      appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
    }
  } else if (action === "listen-prev") {
    if (isGrade2ContinuousExam && !isGrade2DeveloperMode) return;
    appState.listeningIndex = Math.max(0, appState.listeningIndex - 1);
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (action === "listen-goto") {
    if (!appState.listeningReviewMode && !isGrade2DeveloperMode) return;
    if (Number(target.dataset.page) === appState.listeningIndex) return;
    appState.listeningIndex = Number(target.dataset.page);
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
  } else if (action === "speaking-prompt-play") {
    const step = speakingSteps[appState.speakingStep];
    await speakGrade2Prompt(step?.promptSpeech || step?.questionText || "", step?.promptAudioFile || "");
    return;
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
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingStep = Math.min(speakingSteps.length - 1, appState.speakingStep + 1);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  } else if (action === "speaking-prev") {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingStep = Math.max(0, appState.speakingStep - 1);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  } else if (action === "speaking-goto") {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingStep = Number(target.dataset.page);
    appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
  }

  saveState();
  render();
}

function handleChange(event) {
  if (event.target.matches("[data-dev-location]")) {
    moveToDeveloperLocation(event.target.value);
    return;
  }

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
  if (event.target.matches("[data-grade2-gpt-score-draft]")) {
    appState.grade2GptScoreDraft = event.target.value;
    appState.grade2GptScoreMessage = "";
    saveState();
    return;
  }

  if (event.target.matches("[data-speaking-volume]")) {
    appState.speakingOutputVolume = Math.max(0, Math.min(100, Number(event.target.value) || 0));
    const question = listeningQuestions[appState.listeningIndex];
    if (listeningAudioElement) listeningAudioElement.volume = getListeningAudioVolume(question);
    if (listeningInstructionAudioElement) listeningInstructionAudioElement.volume = getListeningAudioVolume(question);
    if (listeningSpeechUtterance) listeningSpeechUtterance.volume = getListeningAudioVolume(question);
    saveState();
    return;
  }

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
  if (blockedWritingEdit?.element === event.target || ["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "deleteByCut"].includes(event.inputType)) {
    event.target.value = blockedWritingEdit?.value ?? appState.writingAnswers[id] ?? "";
    blockedWritingEdit = null;
    return;
  }
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
  const wordRow = app.querySelector("[data-word-row]");
  if (wordRow) {
    wordRow.className = `word-row ${wordStatus.className}`;
  }
  saveState();
}

function blockWritingClipboardAction(event) {
  if (!event.target.closest?.("[data-writing-id]")) return;
  event.preventDefault();
}

function blockWritingBeforeInput(event) {
  if (!event.target.closest?.("[data-writing-id]")) return;
  if (["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "deleteByCut"].includes(event.inputType)) {
    event.preventDefault();
  }
}

function guardWritingInlineInput(event) {
  const id = Number(event.target.dataset.writingId);
  if (blockedWritingEdit?.element !== event.target && !["insertFromPaste", "insertFromPasteAsQuotation", "insertFromDrop", "deleteByCut"].includes(event.inputType)) {
    return true;
  }
  event.target.value = blockedWritingEdit?.value ?? appState.writingAnswers[id] ?? "";
  blockedWritingEdit = null;
  event.stopPropagation();
  return false;
}

function blockWritingClipboardShortcut(event) {
  if (!event.target.closest?.("[data-writing-id]")) return;
  const key = String(event.key || "").toLowerCase();
  if ((event.ctrlKey || event.metaKey) && ["c", "x", "v"].includes(key)) {
    if (["x", "v"].includes(key)) blockedWritingEdit = { element: event.target, value: event.target.value };
    event.preventDefault();
  }
}

function clearBlockedWritingEdit(event) {
  if (blockedWritingEdit?.element === event.target) blockedWritingEdit = null;
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

async function startSpeakingRecording({ renderAfter = true } = {}) {
  const step = speakingSteps[appState.speakingStep];
  if (!step?.recording) {
    appState.speakingRecordMessage = "このステップは録音対象ではありません。";
    saveState();
    if (renderAfter) render();
    return false;
  }
  if (isSpeakingRecordingActive()) return true;
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    appState.speakingRecordMessage = "このブラウザでは録音機能を使えません。";
    saveState();
    if (renderAfter) render();
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
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
      const renderAfterSave = speakingRecorderRenderAfterStop;
      cleanupSpeakingRecorder();
      speakingRecorderRenderAfterStop = true;
      speakingRecordingSavePromise = saveSpeakingRecording(stoppedStep, blob, type, { renderAfter: renderAfterSave });
    });

    recorder.start();
    startSpeakingLevelMonitor(stream).catch(() => {});
    appState.speakingRecordMessage = "録音中です。答え終わったら停止して保存してください。";
    saveState();
    if (renderAfter) render();
    return true;
  } catch (error) {
    cleanupSpeakingRecorder();
    appState.speakingRecordMessage = "マイクを使えませんでした。ブラウザのマイク許可を確認してください。";
    saveState();
    if (renderAfter) render();
    return false;
  }
}

async function stopSpeakingRecording({ renderAfter = true } = {}) {
  if (!isSpeakingRecordingActive()) return false;
  speakingRecorderRenderAfterStop = renderAfter;
  await new Promise((resolve) => {
    const recorder = speakingRecorder;
    const finish = () => resolve();
    recorder.addEventListener("stop", finish, { once: true });
    recorder.stop();
  });
  await speakingRecordingSavePromise.catch(() => {});
  return true;
}

async function saveSpeakingRecording(stepIndex, blob, type, { renderAfter = true } = {}) {
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
  if (renderAfter) render();
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
  stopSpeakingLevelMonitor();
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
  const stepId = speakingSteps[Number(stepIndex)]?.id || "recording";
  const semanticId = {
    "read-aloud": "read-aloud",
    "no-1": "no-1",
    "no-2": "no-2",
    "no-3": "no-3",
    "no-4": "no-4",
  }[stepId];
  if (semanticId) return `${selectedGrade}-${selectedSet.key}-speaking-${semanticId}.${extension}`;
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
    if (isGrade2ContinuousExam && requestParams.get("fresh") === "1") {
      return normalizeState(applyRequestStateOverrides(structuredClone(defaultState)));
    }
    const savedText = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS]
      .map((key) => localStorage.getItem(key))
      .find((value) => Boolean(value));
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
  if (isGrade2DeveloperMode && requestedModule && isModuleAvailable(requestedModule)) {
    state.module = requestedModule;
  }

  const requestedStart = requestParams.get("start") || requestParams.get("started");
  if (requestedStart === "1") state.started = true;
  if (requestedStart === "0") state.started = false;

  const requestedQuestion = Number(requestParams.get("question") || requestParams.get("listen") || "");
  if (isGrade2DeveloperMode && state.module === "listening" && Number.isFinite(requestedQuestion)) {
    const questionIndex = listeningQuestions.findIndex((question) => Number(question.id) === requestedQuestion);
    if (questionIndex >= 0) state.listeningIndex = questionIndex;
  }
  if (isGrade2DeveloperMode && state.module === "reading" && Number.isFinite(requestedQuestion)) {
    const pageIndex = readingPages.findIndex((page) => page.questions.some((question) => Number(question.id) === requestedQuestion));
    if (pageIndex >= 0) {
      state.readingPage = pageIndex;
      const questionIndex = readingPages[pageIndex].questions.findIndex((question) => Number(question.id) === requestedQuestion);
      const step = getReadingStepSize(readingPages[pageIndex]);
      state.readingItemIndex = Math.floor(Math.max(0, questionIndex) / step) * step;
    }
  }
  if (isGrade2DeveloperMode && state.module === "writing" && Number.isFinite(requestedQuestion)) {
    const taskIndex = writingTasks.findIndex((task) => Number(task.id) === requestedQuestion);
    if (taskIndex >= 0) state.writingTask = taskIndex;
  }

  const requestedSpeakingStep = requestParams.has("speakingStep") ? Number(requestParams.get("speakingStep")) : Number.NaN;
  if (isGrade2DeveloperMode && state.module === "speaking" && Number.isInteger(requestedSpeakingStep)) {
    state.speakingStep = Math.min(Math.max(requestedSpeakingStep, 0), speakingSteps.length - 1);
    state.speakingRemaining = getSpeakingStepSeconds(state.speakingStep);
    state.speakingPhaseStatus = "idle";
  }
  if (isGrade2DeveloperMode && requestParams.get("result") === "1") {
    state.started = true;
    state.scored = true;
    state.modal = "complete";
  }

  return state;
}

function normalizeState(state) {
  if (!isModuleAvailable(state.module)) {
    state.module = defaultModule;
    state.started = false;
  }
  if (isGrade2ContinuousExam && !state.started) state.module = defaultModule;
  state.fontLevel = Math.min(FONT_LEVEL_MAX, Math.max(1, Number(state.fontLevel) || 1));
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
  if (!state.listeningIntroducedSections || typeof state.listeningIntroducedSections !== "object") state.listeningIntroducedSections = {};
  if (!state.listeningPlayedQuestionIds || typeof state.listeningPlayedQuestionIds !== "object" || Array.isArray(state.listeningPlayedQuestionIds)) state.listeningPlayedQuestionIds = {};
  state.listeningReviewMode = Boolean(state.listeningReviewMode);
  if (!state.speakingSelfChecks || typeof state.speakingSelfChecks !== "object") state.speakingSelfChecks = {};
  if (typeof state.speakingRecordMessage !== "string") state.speakingRecordMessage = "";
  if (!state.speakingReplayCounts || typeof state.speakingReplayCounts !== "object") state.speakingReplayCounts = {};
  if (!state.speakingChoices || typeof state.speakingChoices !== "object") state.speakingChoices = {};
  state.speakingBreakOpen = Boolean(state.speakingBreakOpen);
  state.speakingOutputVolume = Math.max(0, Math.min(100, Number(state.speakingOutputVolume) || 70));
  state.speakingMicReady = Boolean(state.speakingMicReady);
  state.speakingTestConfirmed = Boolean(state.speakingTestConfirmed);
  state.scored = Boolean(state.scored);
  if (typeof state.grade2GptScoreDraft !== "string") state.grade2GptScoreDraft = "";
  if (typeof state.grade2GptScoreMessage !== "string") state.grade2GptScoreMessage = "";
  if (!state.grade2GptScores || typeof state.grade2GptScores !== "object" || Array.isArray(state.grade2GptScores)) state.grade2GptScores = null;
  if (typeof state.speakingMicMessage !== "string") state.speakingMicMessage = "";
  if (!['idle', 'prompting', 'counting', 'recording', 'awaiting-choice', 'error'].includes(state.speakingPhaseStatus)) state.speakingPhaseStatus = "idle";
  if (isGrade2SpeakingExperience && ['prompting', 'counting', 'recording'].includes(state.speakingPhaseStatus)) state.speakingPhaseStatus = "idle";
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
  LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  if (isGrade2ContinuousExam) syncGrade2ModuleUrl(defaultModule, { started: false });
}

function normalizeGrade2RequestUrl() {
  if (!isGrade2ContinuousExam || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  let changed = false;
  if (url.searchParams.get("plan") === "five") {
    url.searchParams.set("plan", "three");
    changed = true;
  }
  if (url.searchParams.has("fresh")) {
    url.searchParams.delete("fresh");
    changed = true;
  }
  if (changed) window.history.replaceState(null, "", url.toString());
}

function syncGrade2ModuleUrl(moduleKey, { started = true } = {}) {
  if (!isGrade2ContinuousExam || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.set("module", moduleKey);
  url.searchParams.set("start", started ? "1" : "0");
  url.searchParams.delete("started");
  url.searchParams.delete("speakingStep");
  url.searchParams.delete("question");
  url.searchParams.delete("listen");
  window.history.replaceState(null, "", url.toString());
}

function transitionToGrade2Module(moduleKey, { resetWrittenTimer = true } = {}) {
  if (!isGrade2ContinuousExam || !isModuleAvailable(moduleKey)) return;
  stopListeningPlayback();
  grade2SpeakingActivationToken += 1;
  grade2SpeakingDeadline = 0;
  appState.module = moduleKey;
  appState.started = true;
  appState.modal = null;
  if (moduleKey === "listening") {
    appState.listeningIndex = 0;
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
    appState.listeningIntroducedSections = {};
    appState.listeningPlayedQuestionIds = {};
    appState.listeningReviewMode = false;
  }
  if (moduleKey === "reading" && resetWrittenTimer) appState.writtenRemaining = WRITTEN_EXAM_SECONDS;
  if (moduleKey === "writing") appState.writingTask = 0;
  prepareModuleStart();
  syncGrade2ModuleUrl(moduleKey, { started: true });
  saveState();
  render();
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
    if (isGrade2SpeakingExperience) {
      grade2SpeakingDeadline = 0;
      appState.speakingPhaseStatus = "idle";
    }
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
    if (appState.listeningReviewMode || ["review", "review-answer"].includes(listeningPlaybackPhase)) return;
    const question = listeningQuestions[appState.listeningIndex];
    if ((question?.audioFile || question?.script) && (listeningPlaybackQuestionId !== question.id || listeningPlaybackPhase !== "answer")) {
      return;
    }
    if (!listeningAnswerDeadline) {
      listeningAnswerDeadline = Date.now() + appState.listeningAnswerRemaining * 1000;
    }
    const remaining = Math.max(0, Math.ceil((listeningAnswerDeadline - Date.now()) / 1000));
    if (remaining !== appState.listeningAnswerRemaining) {
      appState.listeningAnswerRemaining = remaining;
      updateTimerText("[data-listening-timer]", appState.listeningAnswerRemaining);
      const timerBar = app.querySelector("[data-listening-answer-bar]");
      if (timerBar) {
        const percent = Math.max(0, Math.min(100, (appState.listeningAnswerRemaining / LISTENING_ANSWER_SECONDS) * 100));
        timerBar.style.width = `${percent}%`;
      }
      saveState();
    }
    if (appState.listeningAnswerRemaining > 0) {
      return;
    }

    if (appState.listeningAnswerRemaining <= 0) {
      listeningAnswerDeadline = 0;
      if (appState.listeningIndex >= listeningQuestions.length - 1) {
        if (isGrade2ContinuousExam) {
          transitionToGrade2Module("reading");
          return;
        }
        appState.modal = "complete";
      } else {
        const currentSection = getGrade2ListeningSectionKey(listeningQuestions[appState.listeningIndex]);
        const nextSection = getGrade2ListeningSectionKey(listeningQuestions[appState.listeningIndex + 1]);
        if (currentSection === "part1" && nextSection === "part2") {
          delete appState.listeningIntroducedSections.part2;
        }
        appState.listeningIndex += 1;
        appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
      }
      saveState();
      render();
    }
    return;
  }

  if (appState.module === "speaking") {
    if (isGrade2SpeakingExperience) {
      tickGrade2SpeakingTimer();
      return;
    }
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

function tickGrade2SpeakingTimer() {
  if (!grade2SpeakingDeadline || !["counting", "recording"].includes(appState.speakingPhaseStatus)) return;
  const remaining = Math.max(0, Math.ceil((grade2SpeakingDeadline - performance.now()) / 1000));
  if (remaining !== appState.speakingRemaining) {
    appState.speakingRemaining = remaining;
    updateTimerText("[data-speaking-timer]", formatClock(remaining));
    saveState();
  }
  if (remaining > 0 || grade2SpeakingAdvanceInProgress) return;
  finishGrade2TimedStep().catch(handleGrade2SpeakingFailure);
}

async function finishGrade2TimedStep() {
  if (grade2SpeakingAdvanceInProgress) return;
  grade2SpeakingAdvanceInProgress = true;
  grade2SpeakingActivationToken += 1;
  grade2SpeakingDeadline = 0;
  if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
  grade2SpeakingAdvanceInProgress = false;
  await advanceGrade2SpeakingStep();
}

function updateTimerText(selector, value) {
  const node = app.querySelector(selector);
  if (node) node.textContent = value;
}

render();
loadStoredSpeakingRecordings();
setInterval(tickTimers, 1000);
