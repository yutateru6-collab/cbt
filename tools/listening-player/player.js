(() => {
  "use strict";

  const SET_KEYS = ["set-01", "set-02", "set-03"];
  const SET_LABELS = {
    "set-01": "第1回",
    "set-02": "第2回",
    "set-03": "第3回",
  };

  const allSets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const setMap = new Map(
    allSets
      .filter((set) => SET_KEYS.includes(set.key))
      .map((set) => [set.key, set]),
  );

  const audio = document.getElementById("player-audio");
  const setTabs = document.getElementById("set-tabs");
  const questionList = document.getElementById("question-list");
  const currentSet = document.getElementById("current-set");
  const currentPart = document.getElementById("current-part");
  const currentTitle = document.getElementById("current-title");
  const mobileCurrent = document.getElementById("mobile-current");
  const scriptText = document.getElementById("script-text");
  const questionText = document.getElementById("question-text");
  const choiceList = document.getElementById("choice-list");
  const playbackRate = document.getElementById("playback-rate");
  const continuousPlay = document.getElementById("continuous-play");
  const status = document.getElementById("player-status");

  if (!audio || !setTabs || !questionList || SET_KEYS.some((key) => !setMap.get(key)?.listeningQuestions?.length)) {
    document.body.innerHTML = '<main class="fatal-message"><strong>Listening Playerを読み込めませんでした。</strong><br>第1〜3回のリスニングデータを確認してください。</main>';
    return;
  }

  const state = {
    setKey: "set-01",
    questionIndex: 0,
  };

  function getQuestions() {
    return setMap.get(state.setKey).listeningQuestions;
  }

  function getQuestion() {
    return getQuestions()[state.questionIndex];
  }

  function getPartLabel(question) {
    return question.part === "Part 1" ? "第1部" : "第2部";
  }

  function formatScript(value) {
    return String(value || "")
      .trim()
      .replace(/\s+(?=[AB]:\s)/g, "\n");
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function isSameAudioSource(url) {
    if (!audio.src) return false;
    try {
      return new URL(audio.src, window.location.href).href === new URL(url, window.location.href).href;
    } catch {
      return false;
    }
  }

  function updatePlayButtons() {
    const label = audio.paused ? "再生" : "一時停止";
    document.querySelectorAll('[data-action="toggle-play"]').forEach((button) => {
      button.textContent = label;
      button.setAttribute("aria-label", label);
    });
  }

  function renderSetTabs() {
    setTabs.innerHTML = SET_KEYS.map(
      (key) => `<button type="button" class="set-tab ${key === state.setKey ? "active" : ""}" data-set-key="${key}" aria-pressed="${key === state.setKey}">${SET_LABELS[key]}</button>`,
    ).join("");
  }

  function renderQuestionList() {
    const questions = getQuestions();
    const groups = [
      { label: "第1部", start: 0, end: 15 },
      { label: "第2部", start: 15, end: 30 },
    ];

    questionList.innerHTML = groups.map((group) => {
      const buttons = questions.slice(group.start, group.end).map((question, localIndex) => {
        const index = group.start + localIndex;
        const active = index === state.questionIndex;
        return `<button type="button" class="question-button ${active ? "active" : ""}" data-question-index="${index}" aria-pressed="${active}">No.${question.id}</button>`;
      }).join("");
      return `<section><p class="question-group-title">${group.label}</p><div class="question-grid">${buttons}</div></section>`;
    }).join("");
  }

  function renderContent() {
    const question = getQuestion();
    const setLabel = SET_LABELS[state.setKey];
    const partLabel = getPartLabel(question);

    currentSet.textContent = setLabel;
    currentPart.textContent = partLabel;
    currentTitle.textContent = `No.${question.id}`;
    mobileCurrent.textContent = `No.${question.id}`;
    scriptText.textContent = formatScript(question.script);
    questionText.textContent = question.questionText || question.text || "";
    choiceList.innerHTML = (question.choices || []).map((choice) => `<li>${escapeHtml(choice)}</li>`).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  async function startPlayback() {
    if (!audio.src) return;
    audio.playbackRate = Number(playbackRate.value) || 1;
    try {
      await audio.play();
      setStatus(`${SET_LABELS[state.setKey]} No.${getQuestion().id} を再生中です。`);
    } catch {
      setStatus("再生が開始できませんでした。再生ボタンをもう一度タップしてください。");
    }
    updatePlayButtons();
  }

  function loadCurrentQuestion({ autoplay = false } = {}) {
    const question = getQuestion();
    if (!question?.audioFile) {
      setStatus("この問題には音源が設定されていません。");
      return;
    }

    if (!isSameAudioSource(question.audioFile)) {
      audio.pause();
      audio.src = question.audioFile;
      audio.load();
    }
    audio.playbackRate = Number(playbackRate.value) || 1;

    renderSetTabs();
    renderQuestionList();
    renderContent();
    updatePlayButtons();

    if (autoplay) {
      void startPlayback();
    } else {
      setStatus(`${SET_LABELS[state.setKey]} No.${question.id} を選択しています。`);
    }
  }

  function selectSet(setKey, { autoplay = true } = {}) {
    if (!SET_KEYS.includes(setKey) || !setMap.has(setKey)) return;
    state.setKey = setKey;
    state.questionIndex = 0;
    loadCurrentQuestion({ autoplay });
  }

  function selectQuestion(index, { autoplay = true } = {}) {
    const questions = getQuestions();
    const nextIndex = Math.max(0, Math.min(questions.length - 1, Number(index)));
    if (!Number.isInteger(nextIndex)) return;
    state.questionIndex = nextIndex;
    loadCurrentQuestion({ autoplay });
  }

  function goPrevious() {
    if (state.questionIndex > 0) {
      selectQuestion(state.questionIndex - 1);
    }
  }

  function goNext({ fromContinuous = false } = {}) {
    const questions = getQuestions();
    if (state.questionIndex < questions.length - 1) {
      selectQuestion(state.questionIndex + 1, { autoplay: true });
      return true;
    }

    if (fromContinuous) {
      setStatus(`${SET_LABELS[state.setKey]} No.30まで再生しました。`);
    }
    return false;
  }

  function seekBy(seconds) {
    if (!Number.isFinite(audio.duration)) return;
    const nextTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    audio.currentTime = nextTime;
  }

  async function togglePlayback() {
    if (audio.paused) {
      await startPlayback();
      return;
    }
    audio.pause();
    updatePlayButtons();
  }

  function handleAction(action) {
    if (action === "previous") goPrevious();
    if (action === "next") goNext();
    if (action === "back-10") seekBy(-10);
    if (action === "forward-10") seekBy(10);
    if (action === "toggle-play") void togglePlayback();
  }

  document.addEventListener("click", (event) => {
    const setButton = event.target.closest("[data-set-key]");
    if (setButton) {
      selectSet(setButton.dataset.setKey);
      return;
    }

    const questionButton = event.target.closest("[data-question-index]");
    if (questionButton) {
      selectQuestion(Number(questionButton.dataset.questionIndex));
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton) handleAction(actionButton.dataset.action);
  });

  playbackRate.addEventListener("change", () => {
    audio.playbackRate = Number(playbackRate.value) || 1;
    setStatus(`再生速度を ${playbackRate.options[playbackRate.selectedIndex].text} にしました。`);
  });

  audio.addEventListener("play", updatePlayButtons);
  audio.addEventListener("pause", updatePlayButtons);
  audio.addEventListener("ended", () => {
    updatePlayButtons();
    if (continuousPlay.checked) {
      goNext({ fromContinuous: true });
    } else {
      setStatus(`${SET_LABELS[state.setKey]} No.${getQuestion().id} の再生が終わりました。`);
    }
  });
  audio.addEventListener("error", () => {
    updatePlayButtons();
    setStatus("音源を読み込めませんでした。R2音源の公開状態を確認してください。");
  });

  loadCurrentQuestion({ autoplay: false });
})();
