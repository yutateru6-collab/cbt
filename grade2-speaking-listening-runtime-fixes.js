(() => {
  if (typeof speakingSteps === "undefined" || typeof appState === "undefined" || typeof app === "undefined") return;

  const targetSecondsById = Object.freeze({
    "silent-reading": 20,
    "read-aloud": 60,
    "no-1": 30,
    "no-2-preparation": 20,
    "no-2": 90,
    "no-3": 35,
    "no-4": 35,
  });

  function clampVolume(value, fallback = 70) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.max(0, Math.min(100, numeric));
  }

  function insertStepBefore(targetId, step) {
    if (speakingSteps.some((item) => item?.id === step.id)) return false;
    const targetIndex = speakingSteps.findIndex((item) => item?.id === targetId);
    speakingSteps.splice(targetIndex >= 0 ? targetIndex : speakingSteps.length, 0, step);
    return true;
  }

  function ensureGrade2SampleSpeakingFlowParity() {
    if (!isGrade2SampleExperience) return;

    const currentStepId = speakingSteps[appState.speakingStep]?.id || "";
    let changed = false;

    changed = insertStepBefore("section-start", {
      id: "test-recording",
      phase: "test-recording",
      stage: "受験前チェック 4/5",
      label: "5秒間のテスト録音",
      prompt: "My name is ... など、短い英語をマイクに向かって話してください。",
      visual: "setup",
      recording: true,
      seconds: 5,
    }) || changed;

    changed = insertStepBefore("section-start", {
      id: "test-playback",
      phase: "test-playback",
      stage: "受験前チェック 5/5",
      label: "録音の再生確認",
      prompt: "録音を再生し、声が十分に聞こえることを確認してください。",
      visual: "setup",
      recording: false,
      seconds: 0,
    }) || changed;

    changed = insertStepBefore("card-introduction", {
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
      explanation: `【答え方】週末に楽しんでいることを一つ直接答えます。I enjoy ...ing または I like to ... を使うと自然です。\n【解答例】I enjoy playing sports and watching movies on weekends.\n【評価上の位置づけ】ウォームアップは採点対象外です。短くても質問に合う一文を、面接官に届く声量で答えれば十分です。`,
      explanationTier: "premium",
    }) || changed;

    if (changed && currentStepId) {
      const nextIndex = speakingSteps.findIndex((item) => item?.id === currentStepId);
      if (nextIndex >= 0) appState.speakingStep = nextIndex;
    }
  }

  function applySpeakingTimingContract() {
    for (const step of speakingSteps) {
      if (Object.hasOwn(targetSecondsById, step?.id)) {
        step.seconds = targetSecondsById[step.id];
      }
    }
    const currentStep = speakingSteps[appState.speakingStep];
    if (
      currentStep &&
      Object.hasOwn(targetSecondsById, currentStep.id) &&
      !["counting", "recording"].includes(appState.speakingPhaseStatus)
    ) {
      appState.speakingRemaining = targetSecondsById[currentStep.id];
    }
  }

  ensureGrade2SampleSpeakingFlowParity();
  applySpeakingTimingContract();

  const correctedVolumeStorageKey = `${storageNamespace}-output-volume-v2`;
  try {
    const storedVolume = localStorage.getItem(correctedVolumeStorageKey);
    if (storedVolume !== null) {
      appState.speakingOutputVolume = clampVolume(storedVolume);
    }
  } catch {
    // Storage can be unavailable in restricted preview modes.
  }

  getGrade2OutputVolume = function getGrade2OutputVolumePreservingZero() {
    return clampVolume(appState.speakingOutputVolume) / 100;
  };

  function syncGrade2SpeakingReviewLayout() {
    const body = app.querySelector(".grade2-speaking-body");
    if (!body) return;
    const step = speakingSteps[appState.speakingStep];
    const isReview = step?.phase === "review";
    const stage = body.querySelector(".grade2-speaking-stage");
    const panel = body.querySelector(".grade2-speaking-panel");

    if (stage) stage.hidden = isReview;
    body.classList.toggle("is-review", isReview);
    if (panel) panel.classList.toggle("is-review", isReview);
  }

  function syncVolumeControlsAndPlayback() {
    const volume = clampVolume(appState.speakingOutputVolume);
    for (const control of app.querySelectorAll("[data-speaking-volume]")) {
      if (Number(control.value) !== volume) control.value = String(volume);
    }
    const question = listeningQuestions[appState.listeningIndex];
    const effectiveListeningVolume = typeof getListeningAudioVolume === "function"
      ? getListeningAudioVolume(question)
      : volume / 100;
    if (listeningAudioElement) listeningAudioElement.volume = effectiveListeningVolume;
    if (listeningInstructionAudioElement) listeningInstructionAudioElement.volume = effectiveListeningVolume;
    if (listeningSpeechUtterance) listeningSpeechUtterance.volume = effectiveListeningVolume;
    syncGrade2SpeakingReviewLayout();
  }

  app.addEventListener(
    "input",
    (event) => {
      const control = event.target.closest?.("[data-speaking-volume]");
      if (!control) return;
      const volume = clampVolume(control.value);
      appState.speakingOutputVolume = volume;
      try {
        localStorage.setItem(correctedVolumeStorageKey, String(volume));
      } catch {
        // Keep the in-memory value even if storage is unavailable.
      }
      syncVolumeControlsAndPlayback();
    },
    true,
  );

  new MutationObserver(syncVolumeControlsAndPlayback).observe(app, { childList: true, subtree: true });
  syncVolumeControlsAndPlayback();

  const originalRenderListeningListRow = renderListeningListRow;
  function renderUnavailableListeningRow(id) {
    return `
      <div class="listen-list-row is-unavailable" aria-disabled="true">
        <span class="listen-jump listen-jump-static">No.${id}</span>
        <span class="listen-mark-placeholder" aria-hidden="true"></span>
        <span class="listen-box listen-box-static"></span>
      </div>
    `;
  }

  function renderListeningSectionColumn(label, key, startId, endId, canNavigateListening) {
    const rowsById = new Map(
      listeningQuestions.map((item, index) => [Number(item.id), { item, index }]),
    );
    const rows = [];
    for (let id = startId; id <= endId; id += 1) {
      const entry = rowsById.get(id);
      rows.push(
        entry
          ? originalRenderListeningListRow(entry.item, entry.index, canNavigateListening)
          : renderUnavailableListeningRow(id),
      );
    }
    return `
      <section class="listen-section listen-section-${key}" aria-label="${label}">
        <div class="listen-section-title">${label}</div>
        <div class="listen-section-grid">${rows.join("")}</div>
      </section>
    `;
  }

  const originalRenderListeningAnswerSections = renderListeningAnswerSections;
  renderListeningAnswerSections = function renderListeningAnswerSectionsTwoPartColumns(canNavigateListening) {
    if (!isGrade2SpeakingExperience) return originalRenderListeningAnswerSections(canNavigateListening);
    return [
      renderListeningSectionColumn("第1部", "part1", 1, 15, canNavigateListening),
      renderListeningSectionColumn("第2部", "part2", 16, 30, canNavigateListening),
    ].join("");
  };

  const originalRenderGrade2SpeakingActions = renderGrade2SpeakingActions;
  renderGrade2SpeakingActions = function renderGrade2SpeakingActionsWithRetry(step, status, replayRemaining) {
    if (status === "error" && step?.autoStart) {
      return `
        <div class="speaking-primary-actions">
          <button class="start-button compact" data-action="grade2-speaking-retry-prompt">質問・案内音声をもう一度再生</button>
        </div>
      `;
    }
    return originalRenderGrade2SpeakingActions(step, status, replayRemaining);
  };

  function speakWithBrowserTtsStrict(text) {
    const speechText = String(text || "").trim();
    if (!speechText || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
      return Promise.reject(new Error("Speaking prompt audio and browser TTS are unavailable."));
    }

    return getGrade2SpeakingVoices().then(
      (voices) => new Promise((resolve, reject) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.voice = selectGrade2SpeakingOutputVoice(voices);
        utterance.lang = utterance.voice?.lang || "en-US";
        utterance.rate = 0.92;
        utterance.pitch = 1;
        utterance.volume = getGrade2OutputVolume();
        utterance.addEventListener("end", resolve, { once: true });
        utterance.addEventListener(
          "error",
          (event) => reject(new Error(`Browser TTS failed: ${event.error || "unknown"}`)),
          { once: true },
        );
        window.speechSynthesis.speak(utterance);
      }),
    );
  }

  speakGrade2Prompt = async function speakGrade2PromptReliable(text, audioUrl = "") {
    const speechText = String(text || "").trim();
    if (audioUrl) {
      try {
        await playGrade2SpeakingAudioPrompt(audioUrl);
        return;
      } catch {
        // Fall back to browser TTS only when the packaged audio cannot be played.
      }
    }
    await speakWithBrowserTtsStrict(speechText);
  };

  const originalHandleGrade2SpeakingFailure = handleGrade2SpeakingFailure;
  handleGrade2SpeakingFailure = function handleGrade2SpeakingFailureWithAudioMessage(error) {
    const message = String(error?.message || error || "");
    if (/prompt|audio|tts|play/i.test(message)) {
      grade2SpeakingActivationToken += 1;
      grade2SpeakingDeadline = 0;
      appState.speakingPhaseStatus = "error";
      appState.speakingRecordMessage = "質問・案内音声を再生できませんでした。音量とブラウザの再生許可を確認して、もう一度お試しください。";
      saveState();
      render();
      return;
    }
    originalHandleGrade2SpeakingFailure(error);
  };

  const originalHandleGrade2SpeakingAction = handleGrade2SpeakingAction;
  handleGrade2SpeakingAction = async function handleGrade2SpeakingActionWithRetry(action, target) {
    if (action !== "grade2-speaking-retry-prompt") {
      return originalHandleGrade2SpeakingAction(action, target);
    }

    grade2SpeakingDeadline = 0;
    grade2SpeakingActivationToken += 1;
    if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
    appState.speakingPhaseStatus = "idle";
    appState.speakingRecordMessage = "";
    saveState();
    render();

    try {
      await beginGrade2SpeakingStep({ replay: true });
    } catch (error) {
      handleGrade2SpeakingFailure(error);
    }
  };

  startGrade2ChoiceRecording = async function startGrade2ChoiceRecordingReliable(choice) {
    const stepIndex = appState.speakingStep;
    const step = speakingSteps[stepIndex];
    if (!step?.requiresChoice || appState.speakingPhaseStatus !== "awaiting-choice") return;

    appState.speakingChoices[step.id] = choice;
    appState.speakingPhaseStatus = "prompting";
    appState.speakingRecordMessage = `${choice === "yes" ? "Yes" : "No"} を選択しました。続く質問を聞いてください。`;
    saveState();
    render();

    const token = ++grade2SpeakingActivationToken;
    try {
      await speakGrade2Prompt(
        choice === "yes" ? "Why?" : "Why not?",
        getGrade2SpeakingAudioUrl("common", choice === "yes" ? "why" : "why-not"),
      );
      await waitForGrade2Speaking(650);
      if (token !== grade2SpeakingActivationToken || appState.speakingStep !== stepIndex) return;
      await startGrade2RecordingForCurrentStep();
    } catch (error) {
      handleGrade2SpeakingFailure(error);
    }
  };

  replayGrade2SpeakingQuestion = async function replayGrade2SpeakingQuestionReliable() {
    const step = speakingSteps[appState.speakingStep];
    const replayLimit = Number(step?.replayLimit) || 0;
    const replayCount = Number(appState.speakingReplayCounts[step?.id]) || 0;
    if (!step || replayCount >= replayLimit || grade2SpeakingAdvanceInProgress) return;

    grade2SpeakingAdvanceInProgress = true;
    grade2SpeakingActivationToken += 1;
    try {
      if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
      appState.speakingReplayCounts[step.id] = replayCount + 1;
      appState.speakingPhaseStatus = "idle";
      appState.speakingRemaining = step.seconds;
      grade2SpeakingDeadline = 0;
      saveState();
      render();
    } finally {
      grade2SpeakingAdvanceInProgress = false;
    }

    try {
      await beginGrade2SpeakingStep({ replay: true });
    } catch (error) {
      handleGrade2SpeakingFailure(error);
    }
  };

  advanceGrade2SpeakingStep = async function advanceGrade2SpeakingStepReliable() {
    if (grade2SpeakingAdvanceInProgress) return;

    grade2SpeakingAdvanceInProgress = true;
    grade2SpeakingActivationToken += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    try {
      if (isSpeakingRecordingActive()) await stopSpeakingRecording({ renderAfter: false });
      stopGrade2MicrophoneCheck();
      grade2SpeakingDeadline = 0;
      if (appState.speakingStep < speakingSteps.length - 1) appState.speakingStep += 1;
      appState.speakingPhaseStatus = "idle";
      appState.speakingRemaining = getSpeakingStepSeconds(appState.speakingStep);
      appState.speakingRecordMessage = "";
      saveState();
      render();
    } finally {
      grade2SpeakingAdvanceInProgress = false;
    }

    const nextStep = speakingSteps[appState.speakingStep];
    if (!nextStep?.autoStart || appState.speakingPhaseStatus !== "idle") return;

    try {
      await beginGrade2SpeakingStep();
    } catch (error) {
      handleGrade2SpeakingFailure(error);
    }
  };

  finishGrade2TimedStep = async function finishGrade2TimedStepReliable() {
    if (grade2SpeakingAdvanceInProgress) return;
    grade2SpeakingDeadline = 0;
    await advanceGrade2SpeakingStep();
  };

  // The first app.js render happens before this patch script. Re-render Listening
  // immediately so its navigation patch is visible; Speaking will re-render on its
  // next state transition and retains its current step by id above.
  if (appState.started && appState.module === "listening") render();
})();
