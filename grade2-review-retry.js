(() => {
  "use strict";

  if (window.APP_CONFIG?.mode !== "grade2-product" || typeof appState === "undefined") return;

  const HISTORY_VERSION = 1;
  const HISTORY_KEY = `${storageNamespace}-${selectedSet.key}-attempt-history-v${HISTORY_VERSION}`;
  const FULL_RETRY_FLAG = `${HISTORY_KEY}:full-retry-pending`;
  const ACTIVE_VIEW_KEY = `${HISTORY_KEY}:active-view`;
  const inlinePractice = new Map();
  const baseTransition = transitionToGrade2Module;
  let retrySession = null;
  let retryAiContext = null;
  let pendingTransition = null;
  let reviewAudio = null;
  let enhanceScheduled = false;

  const emptyHistory = () => ({
    version: HISTORY_VERSION,
    initial: null,
    fullAttempts: [],
    retries: { reading: [], listening: [], writing: [], speaking: [] },
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
      if (!parsed || parsed.version !== HISTORY_VERSION) return emptyHistory();
      parsed.fullAttempts = Array.isArray(parsed.fullAttempts) ? parsed.fullAttempts : [];
      parsed.retries = parsed.retries && typeof parsed.retries === "object" ? parsed.retries : {};
      for (const skill of ["reading", "listening", "writing", "speaking"]) {
        if (!Array.isArray(parsed.retries[skill])) parsed.retries[skill] = [];
      }
      return parsed;
    } catch {
      return emptyHistory();
    }
  }

  function saveHistory(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function setActiveView(id) {
    try { sessionStorage.setItem(ACTIVE_VIEW_KEY, id || "initial"); } catch {}
  }

  function getActiveView() {
    try { return sessionStorage.getItem(ACTIVE_VIEW_KEY) || "initial"; } catch { return "initial"; }
  }

  function getFixedSpeakingKey(stepIndex) {
    return `${selectedGrade}:${selectedSet.key}:${stepIndex}`;
  }

  async function readSpeakingByKey(key) {
    try {
      const db = await openSpeakingRecordDb();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction("recordings", "readonly");
        const request = transaction.objectStore("recordings").get(key);
        request.onsuccess = () => { const result = request.result || null; db.close(); resolve(result); };
        request.onerror = () => { db.close(); reject(request.error); };
      });
    } catch {
      return null;
    }
  }

  async function deleteSpeakingByKey(key) {
    try {
      const db = await openSpeakingRecordDb();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction("recordings", "readwrite");
        transaction.objectStore("recordings").delete(key);
        transaction.oncomplete = () => { db.close(); resolve(); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
      });
    } catch {}
  }

  async function archiveSpeaking(prefix) {
    const keys = {};
    if (typeof getGrade2ScoredSpeakingSteps !== "function") return keys;
    for (const { index } of getGrade2ScoredSpeakingSteps()) {
      if (!appState.speakingRecordings?.[index]) continue;
      const record = await getSpeakingRecord(index).catch(() => null);
      if (!record?.blob) continue;
      const key = `${selectedGrade}:${selectedSet.key}:history:${prefix}:${index}`;
      await putSpeakingRecord({ ...record, key });
      keys[index] = key;
    }
    return keys;
  }

  async function restoreSpeaking(keys = {}) {
    if (typeof getGrade2ScoredSpeakingSteps !== "function") return;
    for (const { index } of getGrade2ScoredSpeakingSteps()) {
      const fixedKey = getFixedSpeakingKey(index);
      await deleteSpeakingByKey(fixedKey);
      const archived = keys[index] ? await readSpeakingByKey(keys[index]) : null;
      if (archived?.blob) await putSpeakingRecord({ ...archived, key: fixedKey });
    }
    for (const key of Object.keys(speakingRecordingUrls || {})) {
      if (speakingRecordingUrls[key]) URL.revokeObjectURL(speakingRecordingUrls[key]);
      delete speakingRecordingUrls[key];
    }
    await loadStoredSpeakingRecordings();
  }

  async function clearFixedSpeaking() {
    if (typeof getGrade2ScoredSpeakingSteps !== "function") return;
    for (const { index } of getGrade2ScoredSpeakingSteps()) {
      await deleteSpeakingByKey(getFixedSpeakingKey(index));
      if (speakingRecordingUrls[index]) URL.revokeObjectURL(speakingRecordingUrls[index]);
      delete speakingRecordingUrls[index];
    }
  }

  function makeSnapshot(id, kind) {
    return {
      id,
      kind,
      completedAt: new Date().toISOString(),
      summary: clone(getExamSummary()),
      state: clone(appState),
      gptScores: clone(typeof getValidatedGrade2GptScores === "function" ? getValidatedGrade2GptScores() : null),
      speakingRecordingKeys: {},
    };
  }

  async function ensureAttemptSnapshot() {
    if (!appState.scored || appState.modal !== "complete" || retrySession || retryAiContext) return false;
    const history = loadHistory();
    let fullPending = false;
    try { fullPending = sessionStorage.getItem(FULL_RETRY_FLAG) === "1"; } catch {}

    if (!history.initial && !fullPending) {
      const snapshot = makeSnapshot("initial", "initial");
      snapshot.speakingRecordingKeys = await archiveSpeaking("initial");
      history.initial = snapshot;
      saveHistory(history);
      setActiveView("initial");
      return true;
    }

    if (fullPending) {
      const number = history.fullAttempts.length + 1;
      const snapshot = makeSnapshot(`full-${number}`, "full-retry");
      snapshot.speakingRecordingKeys = await archiveSpeaking(`full-${number}`);
      history.fullAttempts.push(snapshot);
      saveHistory(history);
      setActiveView(snapshot.id);
      try { sessionStorage.removeItem(FULL_RETRY_FLAG); } catch {}
      return true;
    }

    const scores = typeof getValidatedGrade2GptScores === "function" ? getValidatedGrade2GptScores() : null;
    if (!scores) return false;
    const activeId = getActiveView();
    const target = activeId === "initial" ? history.initial : history.fullAttempts.find((item) => item.id === activeId);
    if (!target) return false;
    const previous = JSON.stringify(target.gptScores || null);
    const next = JSON.stringify(scores);
    if (previous === next) return false;
    target.gptScores = clone(scores);
    target.state = clone(appState);
    saveHistory(history);
    return true;
  }

  function restoreAppState(state, showResult = true) {
    const restored = clone(state);
    Object.keys(appState).forEach((key) => delete appState[key]);
    Object.assign(appState, restored);
    appState.started = true;
    appState.scored = true;
    appState.modal = showResult ? "complete" : null;
    saveState();
    render();
  }

  async function restoreAttempt(attempt) {
    if (!attempt?.state) return;
    await restoreSpeaking(attempt.speakingRecordingKeys || {});
    restoreAppState(attempt.state, true);
    setActiveView(attempt.id || "initial");
  }

  function skillScore(snapshot, skill) {
    if (!snapshot) return "—";
    if (skill === "reading" || skill === "listening") {
      const score = snapshot.summary?.[skill];
      return score ? `${score.correct}/${score.total}` : "—";
    }
    const maximum = skill === "writing" ? 32 : 20;
    const score = snapshot.gptScores?.[skill];
    return score ? `${score.total}/${maximum}` : "AI未採点";
  }

  function retryScore(entry, skill) {
    if (skill === "reading" || skill === "listening") return `${entry.correct}/${entry.total}`;
    if (!canViewBonus) return "再挑戦保存済み";
    const maximum = skill === "writing" ? 32 : 20;
    return entry.aiScore ? `${entry.aiScore.total}/${maximum}` : "AI再採点待ち";
  }

  function questionFor(skill, id) {
    const questions = skill === "reading" ? getReadingQuestions() : listeningQuestions;
    return questions.find((question) => Number(question.id) === Number(id)) || null;
  }

  function stopReviewAudio() {
    if (reviewAudio) {
      reviewAudio.pause();
      reviewAudio.removeAttribute("src");
      reviewAudio.load();
      reviewAudio = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  async function playReviewAudio(question, card) {
    stopReviewAudio();
    const status = card?.querySelector("[data-review-audio-status]");
    if (status) status.textContent = "再生しています…";
    if (question?.audioFile) {
      reviewAudio = new Audio(question.audioFile);
      reviewAudio.preload = "auto";
      try {
        if (typeof getListeningAudioVolume === "function") reviewAudio.volume = getListeningAudioVolume(question);
        reviewAudio.addEventListener("ended", () => { if (status) status.textContent = "再生終了"; }, { once: true });
        await reviewAudio.play();
      } catch {
        if (status) status.textContent = "音声を再生できませんでした。";
      }
      return;
    }
    if (question?.script && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined") {
      const utterance = new SpeechSynthesisUtterance(`${question.script} ${question.questionText || ""}`.trim());
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      utterance.addEventListener("end", () => { if (status) status.textContent = "再生終了"; }, { once: true });
      window.speechSynthesis.speak(utterance);
      return;
    }
    if (status) status.textContent = "この問題には再生できる音声がありません。";
  }

  function renderInlinePractice(card, skill, question) {
    const key = `${skill}:${question.id}`;
    const state = inlinePractice.get(key) || { selected: null, checked: false };
    card.classList.add("is-inline-practicing");
    let area = card.querySelector("[data-inline-practice-area]");
    if (!area) {
      area = document.createElement("div");
      area.dataset.inlinePracticeArea = "1";
      area.className = "grade2-inline-practice";
      card.appendChild(area);
    }
    area.innerHTML = `
      <div class="grade2-inline-practice-head"><strong>この問題をもう一度考える</strong><span>ここで選んだ答えは初回スコアに反映されません。</span></div>
      <div class="grade2-inline-practice-choices">
        ${(question.choices || []).map((choice, index) => {
          const number = index + 1;
          return `<button type="button" data-inline-choice="${number}" class="${state.selected === number ? "selected" : ""}"><b>${number}</b><span>${escapeHtml(String(choice ?? ""))}</span></button>`;
        }).join("")}
      </div>
      <div class="grade2-inline-practice-actions"><button type="button" data-inline-check ${state.selected ? "" : "disabled"}>答え合わせ</button><button type="button" data-inline-close>閉じる</button></div>
      <div class="grade2-inline-practice-result" data-inline-result>${state.checked ? (state.selected === question.correct ? "正解です。" : `不正解です。正解は ${question.correct} です。`) : ""}</div>`;
  }

  function enhanceChoiceCards() {
    const pane = document.querySelector(".grade2-result-choice-pane");
    const skill = pane?.getAttribute("aria-label");
    if (!pane || !["reading", "listening"].includes(skill)) return;
    for (const card of pane.querySelectorAll(".grade2-result-review-card")) {
      if (card.dataset.inlinePracticeReady === "1") continue;
      const id = Number((card.querySelector(".grade2-result-review-head span")?.textContent || "").replace(/\D/g, ""));
      if (!questionFor(skill, id)) continue;
      card.dataset.inlinePracticeReady = "1";
      card.dataset.reviewSkill = skill;
      card.dataset.reviewQuestionId = String(id);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.inlinePracticeOpen = "1";
      button.className = "grade2-inline-practice-open";
      button.textContent = "もう一度考える";
      card.querySelector(".grade2-result-review-head")?.appendChild(button);
      if (skill === "listening") {
        const replay = card.querySelector("[data-grade2-listening-review]");
        if (replay && !card.querySelector("[data-review-audio-status]")) replay.insertAdjacentHTML("afterend", '<span class="grade2-review-audio-status" data-review-audio-status></span>');
      }
    }
  }

  function enhanceWritingCards() {
    document.querySelectorAll(".grade2-result-writing-card").forEach((card, index) => {
      if (card.dataset.writingPracticeReady === "1" || !writingTasks[index]) return;
      card.dataset.writingPracticeReady = "1";
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.writingPracticeOpen = String(index);
      button.className = "grade2-inline-practice-open writing";
      button.textContent = "練習用にもう一度書く";
      card.querySelector(".grade2-result-writing-head")?.appendChild(button);
    });
  }

  function renderWritingPractice(card, index) {
    if (!card || !writingTasks[index]) return;
    let area = card.querySelector("[data-writing-practice-area]");
    if (!area) {
      area = document.createElement("div");
      area.dataset.writingPracticeArea = "1";
      area.className = "grade2-writing-practice";
      card.appendChild(area);
    }
    area.innerHTML = '<div><strong>練習用の書き直し</strong><span>初回答案・初回スコアは変更しません。</span></div><textarea data-writing-practice-text placeholder="ここは練習用です。保存・採点対象にはなりません。"></textarea><div class="grade2-writing-practice-foot"><span data-writing-practice-count>0語</span><button type="button" data-writing-practice-close>閉じる</button></div>';
  }

  function historyRows(history, skill) {
    const rows = [];
    if (history.initial) rows.push(`<div><span>初回</span><strong>${skillScore(history.initial, skill)}</strong></div>`);
    history.fullAttempts.forEach((attempt, index) => rows.push(`<div><span>通し再挑戦 ${index + 1}</span><strong>${skillScore(attempt, skill)}</strong></div>`));
    history.retries[skill].forEach((entry, index) => {
      const ai = ["writing", "speaking"].includes(skill) && canViewBonus && !entry.aiScore
        ? `<button type="button" data-retry-ai-skill="${skill}" data-retry-ai-index="${index}">AIで再採点</button>` : "";
      rows.push(`<div><span>技能再挑戦 ${index + 1}</span><strong>${retryScore(entry, skill)}</strong>${ai}</div>`);
    });
    return rows.join("") || "<p>まだ履歴はありません。</p>";
  }

  function enhanceResult() {
    const shell = document.querySelector(".grade2-result-shell");
    const pane = document.querySelector(".grade2-result-pane");
    if (!shell || !pane) return;
    const skill = pane.getAttribute("aria-label");
    if (!["reading", "listening", "writing", "speaking"].includes(skill)) return;

    if (!pane.querySelector("[data-skill-retry]")) {
      const actions = document.createElement("div");
      actions.className = "grade2-retry-actions";
      actions.innerHTML = skill === "speaking" && !canViewBonus
        ? '<span>Speakingの再挑戦・再AI採点は3回プレミアムで利用できます。</span>'
        : `<button type="button" data-skill-retry="${skill}">${skill === "reading" ? "Reading" : skill === "listening" ? "Listening" : skill === "writing" ? "Writing" : "Speaking"}を最初からもう一度解く</button>${canViewBonus ? '<a href="./bonus.html?plan=three" target="_blank" rel="noopener noreferrer">特典を開く</a>' : ""}`;
      pane.querySelector(".grade2-result-pane-head")?.insertAdjacentElement("afterend", actions);
    }

    let box = shell.querySelector("[data-attempt-history]");
    if (!box) {
      box = document.createElement("section");
      box.dataset.attemptHistory = "1";
      box.className = "grade2-attempt-history";
      shell.querySelector(".grade2-result-active-panel")?.insertAdjacentElement("afterend", box);
    }
    const history = loadHistory();
    const signature = JSON.stringify({ skill, history, retryAi: retryAiContext ? `${retryAiContext.skill}:${retryAiContext.index}` : "" });
    if (box.dataset.signature !== signature) {
      box.dataset.signature = signature;
      box.innerHTML = `<div class="grade2-attempt-history-head"><div><span>履歴</span><h2>${skill === "reading" ? "Reading" : skill === "listening" ? "Listening" : skill === "writing" ? "Writing" : "Speaking"}</h2></div><button type="button" data-full-retry>4技能を最初からもう一度受験</button></div><div class="grade2-attempt-history-list">${historyRows(history, skill)}</div><p>個別問題の「もう一度考える」は練習用です。履歴・初回スコアには反映されません。</p>`;
    }

    if (retryAiContext && !shell.querySelector("[data-retry-ai-banner]")) {
      const banner = document.createElement("div");
      banner.dataset.retryAiBanner = "1";
      banner.className = "grade2-retry-ai-banner";
      banner.innerHTML = `<strong>${retryAiContext.skill === "writing" ? "Writing" : "Speaking"}再挑戦のAI再採点モード</strong><span>通常どおりAIへ提出し、JSONを取り込んでください。再挑戦履歴へ点数を保存したあと元の結果へ戻ります。</span>`;
      shell.prepend(banner);
    }
  }

  function enhanceStart() {
    if (document.querySelector(".result-screen")) return;
    const start = document.querySelector(".start-screen");
    const history = loadHistory();
    if (!start || !history.initial || start.querySelector("[data-open-history]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.openHistory = "initial";
    button.className = "small-action grade2-open-history";
    button.textContent = "前回の結果・復習履歴を見る";
    start.querySelector(".start-button")?.insertAdjacentElement("afterend", button);
  }

  function enhanceRetrySpeaking() {
    if (retrySession?.skill !== "speaking") return;
    const button = document.querySelector('[data-action="grade2-speaking-continue"]');
    if (button && button.textContent !== "Speaking再挑戦を終了して結果へ戻る") button.textContent = "Speaking再挑戦を終了して結果へ戻る";
  }

  function scheduleEnhance() {
    if (enhanceScheduled) return;
    enhanceScheduled = true;
    requestAnimationFrame(async () => {
      enhanceScheduled = false;
      if (pendingTransition) return;
      if (document.querySelector(".grade2-result-shell")) {
        const changed = await ensureAttemptSnapshot();
        enhanceChoiceCards();
        enhanceWritingCards();
        enhanceResult();
        if (changed) scheduleEnhance();
      } else {
        enhanceStart();
        enhanceRetrySpeaking();
      }
    });
  }

  function showSkillBreak(from, target, options) {
    pendingTransition = { from, target, options };
    const fromLabel = from === "listening" ? "Listening" : "Reading";
    const targetLabel = target === "reading" ? "Reading" : "Writing";
    app.innerHTML = `<section class="start-screen grade2-skill-break" data-skill-break><div class="grade2-skill-break-card"><span>${fromLabel} 終了</span><h1>ここで一度休憩できます</h1><p>本番通しの得点はまだ表示しません。準備ができたら ${targetLabel} へ進んでください。</p><button type="button" class="start-button" data-skill-break-continue>${targetLabel}へ進む</button></div></section>`;
  }

  async function startSkillRetry(skill) {
    if (retrySession || retryAiContext) return;
    await ensureAttemptSnapshot();
    const history = loadHistory();
    const originalState = clone(appState);
    const speakingBackup = await archiveSpeaking(`retry-backup-${skill}-${Date.now()}`);
    retrySession = { skill, attemptNumber: history.retries[skill].length + 1, originalState, speakingBackup };
    appState.started = true;
    appState.scored = false;
    appState.modal = null;
    appState.module = skill;
    appState.reviews = {};

    if (skill === "reading") {
      appState.answers.written = {};
      appState.readingPage = 0;
      appState.readingItemIndex = 0;
      appState.writtenRemaining = WRITTEN_EXAM_SECONDS;
      appState.drawerOpen = false;
    } else if (skill === "listening") {
      stopListeningPlayback();
      appState.answers.listening = {};
      appState.listeningIndex = 0;
      appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
      appState.listeningAnswerDeadline = 0;
      appState.listeningCountdownQuestionId = null;
      appState.listeningIntroducedSections = {};
      appState.listeningPlayedQuestionIds = {};
      appState.listeningReviewMode = false;
    } else if (skill === "writing") {
      appState.writingAnswers = {};
      appState.writingChecks = {};
      appState.writingTask = 0;
      appState.writtenRemaining = WRITTEN_EXAM_SECONDS;
    } else if (skill === "speaking") {
      if (!canViewBonus) { retrySession = null; return; }
      await clearFixedSpeaking();
      appState.speakingRecordings = {};
      appState.speakingSelfChecks = {};
      appState.speakingReplayCounts = {};
      appState.speakingChoices = {};
      appState.speakingBreakOpen = false;
      appState.speakingMicReady = false;
      appState.speakingMicMessage = "";
      appState.speakingTestConfirmed = false;
      appState.speakingRecordMessage = "";
      appState.speakingStep = 0;
      appState.speakingPhaseStatus = "idle";
      appState.speakingRemaining = getSpeakingStepSeconds(0);
    }
    saveState();
    syncGrade2ModuleUrl(skill, { started: true });
    render();
  }

  async function finishSkillRetry() {
    if (!retrySession) return;
    const session = retrySession;
    retrySession = null;
    const history = loadHistory();
    const entry = { id: `${session.skill}-${session.attemptNumber}`, completedAt: new Date().toISOString(), state: clone(appState), aiScore: null, speakingRecordingKeys: {} };

    if (session.skill === "reading") {
      Object.assign(entry, getChoiceScore(getReadingQuestions(), appState.answers.written), { answers: clone(appState.answers.written) });
    } else if (session.skill === "listening") {
      const scored = listeningQuestions.filter((question) => Number.isFinite(question.correct));
      Object.assign(entry, getChoiceScore(scored, appState.answers.listening), { answers: clone(appState.answers.listening) });
    } else if (session.skill === "writing") {
      entry.answers = clone(appState.writingAnswers);
      entry.speakingRecordingKeys = await archiveSpeaking(`retry-writing-${session.attemptNumber}-companion`);
    } else if (session.skill === "speaking") {
      entry.speakingRecordingKeys = await archiveSpeaking(`retry-speaking-${session.attemptNumber}`);
      entry.recordedCount = Object.keys(entry.speakingRecordingKeys).length;
    }

    history.retries[session.skill].push(entry);
    saveHistory(history);
    await restoreSpeaking(session.speakingBackup || {});
    restoreAppState(session.originalState, true);
    scheduleEnhance();
  }

  async function startRetryAi(skill, index) {
    if (!canViewBonus || retrySession || retryAiContext || !["writing", "speaking"].includes(skill)) return;
    const history = loadHistory();
    const entry = history.retries[skill]?.[index];
    if (!entry?.state) return;
    retryAiContext = {
      skill,
      index,
      restoreState: clone(appState),
      restoreSpeakingKeys: await archiveSpeaking(`retry-ai-restore-${Date.now()}`),
    };
    await restoreSpeaking(entry.speakingRecordingKeys || {});
    const retryState = clone(entry.state);
    Object.keys(appState).forEach((key) => delete appState[key]);
    Object.assign(appState, retryState);
    appState.started = true;
    appState.scored = true;
    appState.modal = "complete";
    appState.grade2GptScores = null;
    appState.grade2GptScoreDraft = "";
    appState.grade2GptScoreMessage = "";
    saveState();
    render();
  }

  async function finishRetryAi() {
    if (!retryAiContext) return;
    const scores = getValidatedGrade2GptScores();
    if (!scores) return;
    const context = retryAiContext;
    retryAiContext = null;
    const history = loadHistory();
    const entry = history.retries[context.skill]?.[context.index];
    if (entry) {
      entry.aiScore = clone(scores[context.skill]);
      entry.aiScoredAt = new Date().toISOString();
      saveHistory(history);
    }
    await restoreSpeaking(context.restoreSpeakingKeys || {});
    restoreAppState(context.restoreState, true);
    scheduleEnhance();
  }

  async function startFullRetry() {
    await ensureAttemptSnapshot();
    await clearFixedSpeaking();
    appState.speakingRecordings = {};
    try { sessionStorage.setItem(FULL_RETRY_FLAG, "1"); } catch {}
    resetState();
    render();
  }

  transitionToGrade2Module = function reviewAwareTransition(moduleKey, options = {}) {
    if (retrySession && moduleKey !== retrySession.skill) {
      finishSkillRetry();
      return;
    }
    const from = appState.module;
    if (!retrySession && !retryAiContext && ((from === "listening" && moduleKey === "reading") || (from === "reading" && moduleKey === "writing"))) {
      showSkillBreak(from, moduleKey, options);
      return;
    }
    return baseTransition(moduleKey, options);
  };

  document.addEventListener("click", (event) => {
    const replay = event.target.closest?.("[data-grade2-listening-review]");
    if (replay && document.querySelector(".grade2-result-shell")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = replay.closest(".grade2-result-review-card");
      const id = Number(card?.dataset.reviewQuestionId || (card?.querySelector(".grade2-result-review-head span")?.textContent || "").replace(/\D/g, ""));
      const question = questionFor("listening", id);
      if (question) playReviewAudio(question, card);
      return;
    }
    if (retrySession?.skill === "writing" && event.target.closest?.('[data-action="complete-exam"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishSkillRetry();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const practiceOpen = event.target.closest?.("[data-inline-practice-open]");
    if (practiceOpen) {
      const card = practiceOpen.closest(".grade2-result-review-card");
      const skill = card?.dataset.reviewSkill;
      const question = questionFor(skill, Number(card?.dataset.reviewQuestionId));
      if (card && question) renderInlinePractice(card, skill, question);
      return;
    }

    const choice = event.target.closest?.("[data-inline-choice]");
    if (choice) {
      const card = choice.closest(".grade2-result-review-card");
      const skill = card?.dataset.reviewSkill;
      const id = Number(card?.dataset.reviewQuestionId);
      const question = questionFor(skill, id);
      if (!question) return;
      inlinePractice.set(`${skill}:${id}`, { selected: Number(choice.dataset.inlineChoice), checked: false });
      renderInlinePractice(card, skill, question);
      return;
    }

    if (event.target.closest?.("[data-inline-check]")) {
      const card = event.target.closest(".grade2-result-review-card");
      const skill = card?.dataset.reviewSkill;
      const id = Number(card?.dataset.reviewQuestionId);
      const question = questionFor(skill, id);
      const state = inlinePractice.get(`${skill}:${id}`);
      if (!question || !state?.selected) return;
      inlinePractice.set(`${skill}:${id}`, { ...state, checked: true });
      renderInlinePractice(card, skill, question);
      return;
    }

    if (event.target.closest?.("[data-inline-close]")) {
      const card = event.target.closest(".grade2-result-review-card");
      card?.classList.remove("is-inline-practicing");
      card?.querySelector("[data-inline-practice-area]")?.remove();
      return;
    }

    const writingOpen = event.target.closest?.("[data-writing-practice-open]");
    if (writingOpen) {
      renderWritingPractice(writingOpen.closest(".grade2-result-writing-card"), Number(writingOpen.dataset.writingPracticeOpen));
      return;
    }
    if (event.target.closest?.("[data-writing-practice-close]")) {
      event.target.closest("[data-writing-practice-area]")?.remove();
      return;
    }

    const retryButton = event.target.closest?.("[data-skill-retry]");
    if (retryButton) { startSkillRetry(retryButton.dataset.skillRetry); return; }
    if (event.target.closest?.("[data-full-retry]")) { startFullRetry(); return; }

    const retryAi = event.target.closest?.("[data-retry-ai-skill]");
    if (retryAi) { startRetryAi(retryAi.dataset.retryAiSkill, Number(retryAi.dataset.retryAiIndex)); return; }

    if (event.target.closest?.("[data-open-history]")) {
      restoreAttempt(loadHistory().initial);
      return;
    }

    if (event.target.closest?.("[data-skill-break-continue]") && pendingTransition) {
      const next = pendingTransition;
      pendingTransition = null;
      baseTransition(next.target, next.options);
      return;
    }

    if (retryAiContext && event.target.closest?.('[data-action="import-grade2-gpt-score"]')) {
      window.setTimeout(() => finishRetryAi(), 0);
    }
  });

  document.addEventListener("input", (event) => {
    if (!event.target.matches?.("[data-writing-practice-text]")) return;
    const count = event.target.value.trim() ? event.target.value.trim().split(/\s+/).length : 0;
    const counter = event.target.closest("[data-writing-practice-area]")?.querySelector("[data-writing-practice-count]");
    if (counter) counter.textContent = `${count}語`;
  });

  new MutationObserver(scheduleEnhance).observe(app, { childList: true, subtree: true });
  scheduleEnhance();
})();
