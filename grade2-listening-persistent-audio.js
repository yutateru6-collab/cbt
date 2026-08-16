(() => {
  // Safari/iOS unlocks audible playback per media element. Keep one Audio
  // instance for the entire listening session and only swap its source.
  const persistentListeningAudio = new Audio();
  persistentListeningAudio.preload = "auto";
  persistentListeningAudio.setAttribute("playsinline", "");
  persistentListeningAudio.setAttribute("webkit-playsinline", "");

  let persistentAudioGeneration = 0;
  let persistentAudioUrl = "";
  let developerDirectPreviewQuestionId = null;

  function resolveListeningAudioUrl(url) {
    try {
      return new URL(url, document.baseURI || window.location.href).href;
    } catch {
      return String(url || "");
    }
  }

  function preparePersistentListeningAudio(url, question, mode) {
    const resolvedUrl = resolveListeningAudioUrl(url);
    const generation = ++persistentAudioGeneration;

    persistentListeningAudio.pause();
    if (persistentAudioUrl !== resolvedUrl) {
      persistentAudioUrl = resolvedUrl;
      persistentListeningAudio.src = resolvedUrl;
      persistentListeningAudio.load();
    } else {
      try {
        persistentListeningAudio.currentTime = 0;
      } catch {
        // The media may not have metadata yet; play() will start from the beginning.
      }
    }

    persistentListeningAudio.volume = getListeningAudioVolume(question);
    persistentListeningAudio.onplaying = null;
    persistentListeningAudio.onended = null;
    persistentListeningAudio.onerror = null;
    persistentListeningAudio.dataset.playbackMode = mode;
    return generation;
  }

  function isCurrentPersistentPlayback(generation, questionId) {
    return generation === persistentAudioGeneration && listeningPlaybackQuestionId === questionId;
  }

  function isDeveloperDirectPreview(question) {
    return Boolean(
      isGrade2DeveloperMode &&
        question &&
        developerDirectPreviewQuestionId !== null &&
        String(question.id) === String(developerDirectPreviewQuestionId),
    );
  }

  function finishDeveloperDirectPreview(question) {
    if (!isDeveloperDirectPreview(question)) return false;
    developerDirectPreviewQuestionId = null;
    cancelListeningAnswerCountdown();
    appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
    listeningPlaybackPhase = "review-answer";
    saveState();
    updateListeningPlaybackUi();
    return true;
  }

  stopListeningPlayback = function stopListeningPlaybackWithPersistentAudio({ preserveCountdown = false } = {}) {
    const keepCountdown = preserveCountdown && isListeningAnswerCountdownActive();
    ++persistentAudioGeneration;
    listeningPlaybackToken += 1;
    persistentListeningAudio.pause();
    persistentListeningAudio.onplaying = null;
    persistentListeningAudio.onended = null;
    persistentListeningAudio.onerror = null;

    if (listeningSpeechUtterance && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    // Do not clear src or discard this Audio instance. On iOS, once the user
    // has explicitly played this element, later source changes can continue on
    // the same unlocked element without requiring a tap for every question.
    listeningInstructionAudioElement = null;
    listeningAudioElement = persistentListeningAudio;
    listeningSpeechUtterance = null;
    listeningAudioPlaybackToken = 0;
    if (!keepCountdown) {
      cancelListeningAnswerCountdown();
      listeningPlaybackQuestionId = null;
      listeningPlaybackPhase = "idle";
    }
  };

  const originalStartListeningAnswerCountdown = startListeningAnswerCountdown;
  startListeningAnswerCountdown = function startListeningAnswerCountdownWithDeveloperPreview(question = listeningQuestions[appState.listeningIndex]) {
    if (finishDeveloperDirectPreview(question)) return;
    return originalStartListeningAnswerCountdown(question);
  };

  playGrade2ListeningInstruction = async function playGrade2ListeningInstructionWithPersistentAudio(question) {
    const sectionKey = getGrade2ListeningSectionKey(question);
    const audioUrl = GRADE2_LISTENING_INSTRUCTION_AUDIO[sectionKey];
    if (!sectionKey || !audioUrl || appState.listeningIntroducedSections[sectionKey]) return false;

    const questionId = question.id;
    const generation = preparePersistentListeningAudio(audioUrl, question, "instruction");
    listeningInstructionAudioElement = persistentListeningAudio;
    listeningAudioElement = persistentListeningAudio;
    listeningPlaybackPhase = "instruction";
    updateListeningPlaybackUi();

    persistentListeningAudio.onplaying = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      listeningPlaybackPhase = "instruction";
      updateListeningPlaybackUi();
    };

    persistentListeningAudio.onended = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      persistentListeningAudio.onended = null;
      listeningInstructionAudioElement = null;
      appState.listeningIntroducedSections[sectionKey] = true;
      listeningPlaybackPhase = question.audioFile ? "audio" : question.script ? "blocked" : "answer";
      saveState();
      updateListeningPlaybackUi();
      void playListeningAudio({ skipInstruction: true });
    };

    persistentListeningAudio.onerror = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      persistentListeningAudio.onerror = null;
      listeningInstructionAudioElement = null;
      listeningPlaybackPhase = "instruction-error";
      updateListeningPlaybackUi();
    };

    try {
      listeningPlaybackStarts += 1;
      await persistentListeningAudio.play();
    } catch {
      if (isCurrentPersistentPlayback(generation, questionId)) {
        listeningInstructionAudioElement = null;
        listeningPlaybackPhase = "instruction-error";
        updateListeningPlaybackUi();
      }
    }
    return true;
  };

  const originalPlayListeningAudio = playListeningAudio;

  playListeningAudio = async function playListeningAudioWithPersistentElement({ force = false, skipInstruction = false } = {}) {
    const question = listeningQuestions[appState.listeningIndex];
    if (!question) return;
    const directPreview = isDeveloperDirectPreview(question);

    if (!force && !directPreview && !appState.listeningReviewMode && hasPlayedListeningQuestion(question.id)) {
      listeningPlaybackPhase = "review-answer";
      updateListeningPlaybackUi();
      return;
    }

    if (!skipInstruction && !directPreview && needsGrade2ListeningInstruction(question)) {
      await playGrade2ListeningInstruction(question);
      return;
    }

    // Keep the existing browser-speech fallback for data that has no audio file.
    if (!question.audioFile) {
      await originalPlayListeningAudio({ force: force || directPreview, skipInstruction: true });
      return;
    }

    const questionId = question.id;
    const generation = preparePersistentListeningAudio(question.audioFile, question, "question");
    listeningInstructionAudioElement = null;
    listeningAudioElement = persistentListeningAudio;
    listeningPlaybackPhase = "audio";
    updateListeningPlaybackUi();

    persistentListeningAudio.onplaying = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      if (!directPreview) markListeningQuestionPlayed(questionId);
      listeningPlaybackPhase = "audio";
      updateListeningPlaybackUi();
    };

    persistentListeningAudio.onended = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      persistentListeningAudio.onended = null;
      if (finishDeveloperDirectPreview(question)) {
        return;
      }
      if (appState.listeningReviewMode) {
        listeningPlaybackPhase = "review";
      } else {
        originalStartListeningAnswerCountdown(question);
      }
      saveState();
      updateListeningPlaybackUi();
    };

    persistentListeningAudio.onerror = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      persistentListeningAudio.onerror = null;
      if (directPreview) developerDirectPreviewQuestionId = null;
      listeningPlaybackPhase = "error";
      updateListeningPlaybackUi();
    };

    try {
      listeningPlaybackStarts += 1;
      await persistentListeningAudio.play();
    } catch {
      if (isCurrentPersistentPlayback(generation, questionId)) {
        listeningPlaybackPhase = "blocked";
        updateListeningPlaybackUi();
      }
    }
  };

  const originalMoveToDeveloperLocation = moveToDeveloperLocation;
  moveToDeveloperLocation = function moveToDeveloperLocationWithListeningPreview(value) {
    const parts = String(value || "").split(":");
    if (isGrade2DeveloperMode && parts[0] === "listening") {
      const index = Math.min(Math.max(Number(parts[1]) || 0, 0), Math.max(0, listeningQuestions.length - 1));
      developerDirectPreviewQuestionId = listeningQuestions[index]?.id ?? null;
    } else {
      developerDirectPreviewQuestionId = null;
    }
    return originalMoveToDeveloperLocation(value);
  };

  replayListeningAudioForDeveloper = async function replayListeningAudioForDeveloperWithPersistentAudio() {
    if (!isGrade2DeveloperMode) return;
    const question = listeningQuestions[appState.listeningIndex];
    if (!question?.audioFile && !question?.script) return;

    developerDirectPreviewQuestionId = question.id;
    stopListeningPlayback();
    listeningPlaybackQuestionId = question.id;
    resetListeningAnswerCountdown();
    listeningPlaybackPhase = question.audioFile ? "audio" : "blocked";
    await playListeningAudio({ force: true, skipInstruction: true });
  };

  mountListeningAudio = function mountListeningAudioWithPersistentElement() {
    const question = listeningQuestions[appState.listeningIndex];
    if (
      developerDirectPreviewQuestionId !== null &&
      question &&
      String(question.id) !== String(developerDirectPreviewQuestionId)
    ) {
      developerDirectPreviewQuestionId = null;
    }

    if (isDeveloperDirectPreview(question)) {
      void playListeningAudio({ force: true, skipInstruction: true });
      return;
    }

    if (["answer", "review", "review-answer"].includes(listeningPlaybackPhase)) {
      updateListeningPlaybackUi();
      return;
    }
    void playListeningAudio();
  };
})();
