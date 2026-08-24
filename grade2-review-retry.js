(() => {
  "use strict";

  if (window.APP_CONFIG?.mode !== "grade2-product" || typeof appState === "undefined") return;

  const HISTORY_VERSION = 1;
  const HISTORY_KEY = `${storageNamespace}-${selectedSet.key}-attempt-history-v${HISTORY_VERSION}`;
  const FULL_RETRY_FLAG = `${HISTORY_KEY}:full-retry-pending`;
  const ACTIVE_VIEW_KEY = `${HISTORY_KEY}:active-view`;
  const inlinePractice = new Map();
  let retrySession = null;
  let retryAiContext = null;
  let pendingTransition = null;
  let reviewAudio = null;

  const baseTransitionToGrade2Module = transitionToGrade2Module;

  function clone(value) {
    return JSON.parse(JSON.stringify(value ?? null));
  }

  function loadHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null");
      if (!parsed || parsed.version !== HISTORY_VERSION) {
        return { version: HISTORY_VERSION, initial: null, fullAttempts: [], retries: { reading: [], listening: [], writing: [], speaking: [] } };
      }
      parsed.fullAttempts = Array.isArray(parsed.fullAttempts) ? parsed.fullAttempts : [];
      parsed.retries = parsed.retries && typeof parsed.retries === "object" ? parsed.retries : {};
      for (const skill of ["reading", "listening", "writing", "speaking"]) {
        if (!Array.isArray(parsed.retries[skill])) parsed.retries[skill] = [];
      }
      return parsed;
    } catch {
      return { version: HISTORY_VERSION, initial: null, fullAttempts: [], retries: { reading: [], listening: [], writing: [], speaking: [] } };
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

  async function readSpeakingRecordByKey(key) {
    try {
      const db = await openSpeakingRecordDb();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction("recordings", "readonly");
        const request = transaction.objectStore("recordings").get(key);
        request.onsuccess = () => { const value = request.result || null; db.close(); resolve(value); };
        request.onerror = () => { db.close(); reject(request.error); };
      });
    } catch {
      return null;
    }
  }

  async function deleteSpeakingRecordByKey(key) {
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

  async function archiveCurrentSpeaking(prefix) {
    const keys = {};
    if (typeof getGrade2ScoredSpeakingSteps !== "function") return keys;
    for (const { index } of getGrade2ScoredSpeakingSteps()) {
      const record = await getSpeakingRecord(index).catch(() => null);
      if (!record?.blob) continue;
      const key = `${selectedGrade}:${selectedSet.key}:history:${prefix}:${index}`;
      await putSpeakingRecord({ ...record, key });
      keys[index] = key;
    }
    return keys;
  }

  async function restoreSpeakingArchive(keys = {}) {
    if (typeof getGrade2ScoredSpeakingSteps !== "function") return;
    for (const { index } of getGrade2ScoredSpeakingSteps()) {
      const fixedKey = getFixedSpeakingKey(index);
      await deleteSpeakingRecordByKey(fixedKey);
      const archivedKey = keys[index];
      if (!archivedKey) continue;
      const record = await readSpeakingRecordByKey(archivedKey);
      if (record?.blob) await putSpeakingRecord({ ...record, key: fixedKey });
    }
    for (const key of Object.keys(speakingRecordingUrls || {})) {
      const url = speakingRecordingUrls[key];
      if (url) URL.revokeObjectURL(url);
      delete speakingRecordingUrls[key];
    }
    await loadStoredSpeakingRecordings();
  }

  async function clearCurrentSpeakingRecords() {
    if (typeof getGrade2ScoredSpeakingSteps !== "function") return;
    for (const { index } of getGrade2ScoredSpeakingSteps()) {
      await deleteSpeakingRecordByKey(getFixedSpeakingKey(index));
      if (speakingRecordingUrls[index]) URL.revokeObjectURL(speakingRecordingUrls[index]);
      delete speakingRecordingUrls[index];
    }
  }

  function makeSnapshot(id, kind) {
    const summary = getExamSummary();
    return {
      id,
      kind,
      completedAt: new Date().toISOString(),
      summary: clone(summary),
      state: clone(appState),
      gptScores: clone(typeof getValidatedGrade2GptScores === "function" ? getValidatedGrade2GptScores() : null),
      speakingRecordingKeys: {},
    };
  }

  async function ensureAttemptSnapshot() {
    if (!appState.scored || appState.modal !== "complete" || retrySession || retryAiContext) return;
    const history = loadHistory();
    const fullRetryPending = (() => {
      try { return sessionStorage.getItem(FULL_RETRY_FLAG) === "1"; } catch { return false; }
    })();

    if (!history.initial && !fullRetryPending) {
      const snapshot = makeSnapshot("initial", "initial");
      snapshot.speakingRecordingKeys = await archiveCurrentSpeaking("initial");
      history.initial = snapshot;
      saveHistory(history);
      setActiveView("initial");
      return;
    }

    if (fullRetryPending) {
      const number = history.fullAttempts.length + 1;
      const snapshot = makeSnapshot(`full-${number}`, "full-retry");
      snapshot.speakingRecordingKeys = await archiveCurrentSpeaking(`full-${number}`);
      history.fullAttempts.push(snapshot);
      saveHistory(history);
      setActiveView(snapshot.id);
      try { sessionStorage.removeItem(FULL_RETRY_FLAG); } catch {}
      return;
    }

    syncScoresIntoActiveHistory();
  }

  function syncScoresIntoActiveHistory() {
    const scores = typeof getValidatedGrade2GptScores === "function" ? getValidatedGrade2GptScores() : null;
    if (!scores || retryAiContext) return;
    const history = loadHistory();
    const activeId = getActiveView();
    const target = activeId === "initial" ? history.initial : history.fullAttempts.find((item) => item.id === activeId);
    if (!target) return;
    target.gptScores = clone(scores);
    target.state = clone(appState);
    saveHistory(history);
  }

  function restoreState(state, { showResult = true } = {}) {
    const restored = clone(state);
    Object.keys(appState).forEach((key) => delete appState[key]);
    Object.assign(appState, restored);
    appState.started = true;
    appState.scored = true;
    appState.modal = showResult ? "complete" : null;
    saveState();
    render();
  }

  async function restoreHistoryAttempt(attempt) {
    if (!attempt?.state) return;
    await restoreSpeakingArchive(attempt.speakingRecordingKeys || {});
    restoreState(attempt.state, { showResult: true });
    setActiveView(attempt.id || "initial");
  }

  function scoreForSkill(snapshot, skill) {
    if (!snapshot) return "—";
    if (skill === "reading" || skill === "listening") {
      const score = snapshot.summary?.[skill];
      return score ? `${score.correct}/${score.total}` : "—";
    }
    const score = snapshot.gptScores?.[skill];
    const maximum = skill === "writing" ? 32 : 20;
    return score ? `${score.total}/${maximum}` : "AI未採点";
  }

  function getRetryScoreLabel(entry, skill) {
    if (["reading", "listening"].includes(skill)) return `${entry.correct}/${entry.total}`;
    const maximum = skill === "writing" ? 32 : 20;
    return entry.aiScore ? `${entry.aiScore.total}/${maximum}` : "AI再採点待ち";
  }

  function getQuestion(skill, id) {
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

  async function playQuestionForReview(question, card) {
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
        return;
      } catch {
        if (status) status.textContent = "音声を再生できませんでした。";
        return;
      }
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

  function renderInlineChoicePractice(card, skill, question) {
    const key = `${skill}:${question.id}`;
    const current = inlinePractice.get(key) || { selected: null, checked: false };
    card.classList.add("is-inline-practicing");
    let area = card.querySelector("[data-inline-practice-area]");
    if (!area) {
      area = document.createElement("div");
      area.dataset.inlinePracticeArea = "1";
      area.className = "grade2-inline-practice";
      card.appendChild(area);
    }
    area.innerHTML = `
      <div class="grade2-inline-practice-head">
        <strong>この問題をもう一度考える</strong>
        <span>ここで選んだ答えは初回スコアに反映されません。</span>
      </div>
      <div class="grade2-inline-practice-choices">
        ${(question.choices || []).map((choice, index) => {
          const number = index + 1;
          return `<button type="button" data-inline-choice="${number}" class="${current.selected === number ? "selected" : ""}"><b>${number}</b><span>${escapeHtml(String(choice ?? ""))}</span></button>`;
        }).join("")}
      </div>
      <div class="grade2-inline-practice-actions">
        <button type="button" data-inline-check ${current.selected ? "" : "disabled"}>答え合わせ</button>
        <button type="button" data-inline-close>閉じる</button>
      </div>
      <div class="grade2-inline-practice-result" data-inline-result>${current.checked ? (current.selected === question.correct ? "正解です。" : `不正解です。正解は ${question.correct} です。`) : ""}</div>
    `;
  }

  function enhanceChoiceCards() {
    const pane = document.querySelector(".grade2-result-choice-pane");
    const skill = pane?.getAttribute("aria-label");
    if (!pane || !["reading", "listening"].includes(skill)) return;
    for (const card of pane.querySelectorAll(".grade2-result-review-card")) {
      if (card.dataset.inlinePracticeReady === "1") continue;
      const label = card.querySelector(".grade2-result-review-head span")?.textContent || "";
      const id = Number(label.replace(/\D/g, ""));
      const question = getQuestion(skill, id);
      if (!question) continue;
      card.dataset.inlinePracticeReady = "1";
      card.dataset.reviewSkill = skill;
      card.dataset.reviewQuestionId = String(id);
      const action = document.createElement("button");
      action.type = "button";
      action.className = "grade2-inline-practice-open";
      action.dataset.inlinePracticeOpen = "1";
      action.textContent = "もう一度考える";
      card.querySelector(".grade2-result-review-head")?.appendChild(action);
      if (skill === "listening") {
        const replay = card.querySelector("[data-grade2-listening-review]");
        if (replay) {
          replay.textContent = "▶ この問題を聞き直す";
          replay.insertAdjacentHTML("afterend", '<span class="grade2-review-audio-status" data-review-audio-status></span>');
        }
      }
    }
  }

  function enhanceWritingCards() {
    document.querySelectorAll(".grade2-result-writing-card").forEach((card, index) => {
      if (card.dataset.writingPracticeReady === "1") return;
      card.dataset.writingPracticeReady = "1";
      const task = writingTasks[index];
      if (!task) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "grade2-inline-practice-open writing";
      button.dataset.writingPracticeOpen = String(index);
      button.textContent = "練習用にもう一度書く";
      card.querySelector(".grade2-result-writing-head")?.appendChild(button);
    });
  }

  function renderWritingPractice(card, index) {
    const task = writingTasks[index];
    if (!task) return;
    let area = card.querySelector("[data-writing-practice-area]");
    if (!area) {
      area = document.createElement("div");
      area.dataset.writingPracticeArea = "1";
      area.className = "grade2-writing-practice";
      card.appendChild(area);
    }
    area.innerHTML = `
      <div><strong>練習用の書き直し</strong><span>初回答案・初回スコアは変更しません。</span></div>
      <textarea data-writing-practice-text placeholder="ここは練習用です。保存・採点対象にはなりません。"></textarea>
      <div class="grade2-writing-practice-foot"><span data-writing-practice-count>0語</span><button type="button" data-writing-practice-close>閉じる</button></div>
    `;
  }

  function historyRows(history, skill) {
    const rows = [];
    if (history.initial) rows.push(`<div><span>初回</span><strong>${scoreForSkill(history.initial, skill)}</strong></div>`);
    for (const full of history.fullAttempts) rows.push(`<div><span>通し再挑戦 ${full.id.replace("full-", "")}</span><strong>${scoreForSkill(full, skill)}</strong></div>`);
    for (const [index, retry] of history.retries[skill].entries()) {
      const aiButton = ["writing", "speaking"].includes(skill) && canViewBonus && !retry.aiScore
        ? `<button type="button" data-retry-ai-skill="${skill}" data-retry-ai-index="${index}">AIで再採点</button>`
        : "";
      rows.push(`<div><span>${skill === "reading" ? "Reading" : skill === "listening" ? "Listening" : skill === "writing" ? "Writing" : "Speaking"}再挑戦 ${index + 1}</span><strong>${getRetryScoreLabel(retry, skill)}</strong>${aiButton}</div>`);
    }
    return rows.join("") || "<p>まだ履歴はありません。</p>";
  }

  function enhanceResultActions() {
    const shell = document.querySelector(".grade2-result-shell");
    const pane = document.querySelector(".grade2-result-pane");
    if (!shell || !pane) return;
    const skill = pane.getAttribute("aria-label");
    if (!["reading", "listening", "writing", "speaking"].includes(skill)) return;

    if (!pane.querySelector("[data-skill-retry]")) {
      const actions = document.createElement("div");
      actions.className = "grade2-retry-actions";
      const speakingAllowed = skill !== "speaking" || canViewBonus;
      actions.innerHTML = `
        ${speakingAllowed ? `<button type="button" data-skill-retry="${skill}">${skill === "reading" ? "Reading" : skill === "listening" ? "Listening" : skill === "writing" ? "Writing" : "Speaking"}を最初からもう一度解く</button>` : `<span>Speakingの再挑戦・再AI採点は3回プレミアムで利用できます。</span>`}
        ${canViewBonus ? '<a href="./bonus.html?plan=three" target="_blank" rel="noopener noreferrer">特典を開く</a>' : ""}
      `;
      pane.querySelector(".grade2-result-pane-head")?.insertAdjacentElement("afterend", actions);
    }

    let historyBox = shell.querySelector("[data-attempt-history]");
    if (!historyBox) {
      historyBox = document.createElement("section");
      historyBox.dataset.attemptHistory = "1";
      historyBox.className = "grade2-attempt-history";
      shell.querySelector(".grade2-result-active-panel")?.insertAdjacentElement("afterend", historyBox);
    }
    const history = loadHistory();
    historyBox.innerHTML = `
      <div class="grade2-attempt-history-head"><div><span>履歴</span><h2>${skill === "reading" ? "Reading" : skill === "listening" ? "Listening" : skill === "writing" ? "Writing" : "Speaking"}</h2></div><button type="button" data-full-retry>4技能を最初からもう一度受験</button></div>
      <div class="grade2-attempt-history-list">${historyRows(history, skill)}</div>
      <p>個別問題の「もう一度考える」は練習用です。履歴・初回スコアには反映されません。</p>
    `;

    if (retryAiContext && !shell.querySelector("[data-retry-ai-banner]")) {
      const banner = document.createElement("div");
      banner.dataset.retryAiBanner = "1";
      banner.className = "grade2-retry-ai-banner";
      banner.innerHTML = `<strong>${retryAiContext.skill === "writing" ? "Writing" : "Speaking"}再挑戦のAI再採点モード</strong><span>通常どおり採点データをAIへ渡し、JSONを取り込んでください。取り込み後、この再挑戦の履歴へ点数を保存して元の結果へ戻ります。</span>`;
      shell.prepend(banner);
    }
  }

  function enhanceStartScreen() {
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

  function enhanceRetrySpeakingUi() {
    if (!retrySession || retrySession.skill !== "speaking") return;
    const continueButton = document.querySelector('[data-action="grade2-speaking-continue"]');
    if (continueButton) continueButton.textContent = "Speaking再挑戦を終了して結果へ戻る";
  }

  function enhanceSkillBreak() {
    if (!pendingTransition) return;
    if (document.querySelector("[data-skill-break]")) return;
    const fromLabel = pendingTransition.from === "listening" ? "Listening" : pendingTransition.from === "reading" ? "Reading" : pendingTransition.from;
    const toLabel = pendingTransition.target === "reading" ? "Reading" : pendingTransition.target === "writing" ? "Writing" : pendingTransition.target;
    app.innerHTML = `
      <section class="start-screen grade2-skill-break" data-skill-break>
        <div class="grade2-skill-break-card">
          <span>${fromLabel} 終了</span>
          <h1>ここで一度休憩できます</h1>
          <p>本番通しの得点はまだ表示しません。準備ができたら ${toLabel} へ進んでください。</p>
          <button type="button" class="start-button" data-skill-break-continue>${toLabel}へ進む</button>
        </div>
      </section>`;
  }

  function enhance() {
    if (pendingTransition) {
      enhanceSkillBreak();
      return;
    }
    if (document.querySelector(".grade2-result-shell")) {
      ensureAttemptSnapshot().then(() => {
        enhanceChoiceCards();
        enhanceWritingCards();
        enhanceResultActions();
      });
    } else {
      enhanceStartScreen();
      enhanceRetrySpeakingUi();
    }
  }

  async function startSkillRetry(skill) {
    if (retrySession || retryAiContext) return;
    await ensureAttemptSnapshot();
    const originalState = clone(appState);
    const history = loadHistory();
    const attemptNumber = history.retries[skill].length + 1;
    const speakingBackup = await archiveCurrentSpeaking(`retry-backup-${skill}-${Date.now()}`);
    retrySession = { skill, attemptNumber, originalState, speakingBackup, startedAt: new Date().toISOString() };

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
      await clearCurrentSpeakingRecords();
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
    const entry = {
      id: `${session.skill}-${session.attemptNumber}`,
      completedAt: new Date().toISOString(),
      state: clone(appState),
      aiScore: null,
      speakingRecordingKeys: {},
    };

    if (session.skill === "reading") {
      const score = getChoiceScore(getReadingQuestions(), appState.answers.written);
      Object.assign(entry, score, { answers: clone(appState.answers.written) });
    } else if (session.skill === "listening") {
      const scored = listeningQuestions.filter((question) => Number.isFinite(question.correct));
      const score = getChoiceScore(scored, appState.answers.listening);
      Object.assign(entry, score, { answers: clone(appState.answers.listening) });
    } else if (session.skill === "writing") {
      entry.answers = clone(appState.writingAnswers);
      entry.speakingRecordingKeys = await archiveCurrentSpeaking(`retry-writing-${session.attemptNumber}-companion`);
    } else if (session.skill === "speaking") {
      entry.speakingRecordingKeys = await archiveCurrentSpeaking(`retry-speaking-${session.attemptNumber}`);
      entry.recordedCount = Object.keys(entry.speakingRecordingKeys).length;
    }

    history.retries[session.skill].push(entry);
    saveHistory(history);
    await restoreSpeakingArchive(session.speakingBackup || {});
    restoreState(session.originalState, { showResult: true });
    enhance();
  }

  async function startRetryAi(skill, index) {
    if (!canViewBonus || retrySession || retryAiContext) return;
    const history = loadHistory();
    const entry = history.retries[skill]?.[index];
    if (!entry?.state || !["writing", "speaking"].includes(skill)) return;
    const restoreStateSnapshot = clone(appState);
    const restoreSpeakingKeys = await archiveCurrentSpeaking(`retry-ai-restore-${Date.now()}`);
    retryAiContext = { skill, index, restoreStateSnapshot, restoreSpeakingKeys };

    await restoreSpeakingArchive(entry.speakingRecordingKeys || {});
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

  async function finishRetryAiIfReady() {
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
    await restoreSpeakingArchive(context.restoreSpeakingKeys || {});
    restoreState(context.restoreStateSnapshot, { showResult: true });
  }

  async function startFullRetry() {
    await ensureAttemptSnapshot();
    try { sessionStorage.setItem(FULL_RETRY_FLAG, "1"); } catch {}
    resetState();
    render();
  }

  transitionToGrade2Module = function patchedTransition(moduleKey, options = {}) {
    if (retrySession && moduleKey !== retrySession.skill) {
      finishSkillRetry();
      return;
    }

    const from = appState.module;
    const shouldPause = !retryAiContext && !retrySession && ((from === "listening" && moduleKey === "reading") || (from === "reading" && moduleKey === "writing"));
    if (shouldPause) {
      pendingTransition = { from, target: moduleKey, options };
      enhanceSkillBreak();
      return;
    }
    return baseTransitionToGrade2Module(moduleKey, options);
  };

  document.addEventListener("click", (event) => {
    const listeningReplay = event.target.closest?.("[data-grade2-listening-review]");
    if (listeningReplay && document.querySelector(".grade2-result-shell")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const card = listeningReplay.closest(".grade2-result-review-card");
      const id = Number(card?.dataset.reviewQuestionId || card?.querySelector(".grade2-result-review-head span")?.textContent?.replace(/\D/g, ""));
      const question = getQuestion("listening", id);
      if (question) playQuestionForReview(question, card);
      return;
    }

    if (retrySession?.skill === "writing" && event.target.closest?.('[data-action="complete-exam"]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      finishSkillRetry();
    }
  }, true);

  document.addEventListener("click", (event) => {
    const openPractice = event.target.closest?.("[data-inline-practice-open]");
    if (openPractice) {
      const card = openPractice.closest(".grade2-result-review-card");
      const skill = card?.dataset.reviewSkill;
      const id = Number(card?.dataset.reviewQuestionId);
      const question = getQuestion(skill, id);
      if (card && question) renderInlineChoicePractice(card, skill, question);
      return;
    }

    const choice = event.target.closest?.("[data-inline-choice]");
    if (choice) {
      const card = choice.closest(".grade2-result-review-card");
      const skill = card?.dataset.reviewSkill;
      const id = Number(card?.dataset.reviewQuestionId);
      const question = getQuestion(skill, id);
      if (!question) return;
      inlinePractice.set(`${skill}:${id}`, { selected: Number(choice.dataset.inlineChoice), checked: false });
      renderInlineChoicePractice(card, skill, question);
      return;
    }

    const check = event.target.closest?.("[data-inline-check]");
    if (check) {
      const card = check.closest(".grade2-result-review-card");
      const skill = card?.dataset.reviewSkill;
      const id = Number(card?.dataset.reviewQuestionId);
      const question = getQuestion(skill, id);
      const state = inlinePractice.get(`${skill}:${id}`);
      if (!question || !state?.selected) return;
      inlinePractice.set(`${skill}:${id}`, { ...state, checked: true });
      renderInlineChoicePractice(card, skill, question);
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

    const skillRetry = event.target.closest?.("[data-skill-retry]");
    if (skillRetry) {
      startSkillRetry(skillRetry.dataset.skillRetry);
      return;
    }

    const fullRetry = event.target.closest?.("[data-full-retry]");
    if (fullRetry) {
      startFullRetry();
      return;
    }

    const retryAi = event.target.closest?.("[data-retry-ai-skill]");
    if (retryAi) {
      startRetryAi(retryAi.dataset.retryAiSkill, Number(retryAi.dataset.retryAiIndex));
      return;
    }

    const openHistory = event.target.closest?.("[data-open-history]");
    if (openHistory) {
      const history = loadHistory();
      restoreHistoryAttempt(history.initial);
      return;
    }

    const continueBreak = event.target.closest?.("[data-skill-break-continue]");
    if (continueBreak && pendingTransition) {
      const transition = pendingTransition;
      pendingTransition = null;
      baseTransitionToGrade2Module(transition.target, transition.options);
      return;
    }

    if (retryAiContext && event.target.closest?.('[data-action="import-grade2-gpt-score"]')) {
      window.setTimeout(() => finishRetryAiIfReady(), 0);
    }
  });

  document.addEventListener("input", (event) => {
    if (!event.target.matches?.("[data-writing-practice-text]")) return;
    const count = event.target.value.trim() ? event.target.value.trim().split(/\s+/).length : 0;
    const counter = event.target.closest("[data-writing-practice-area]")?.querySelector("[data-writing-practice-count]");
    if (counter) counter.textContent = `${count}語`;
  });

  const observer = new MutationObserver(() => enhance());
  observer.observe(app, { childList: true, subtree: true });
  enhance();
})();
