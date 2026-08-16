(() => {
  // Safari/iOS unlocks audible playback per media element. Keep one Audio
  // instance for the entire listening session and only swap its source.
  const persistentListeningAudio = new Audio();
  persistentListeningAudio.preload = "auto";
  persistentListeningAudio.setAttribute("playsinline", "");
  persistentListeningAudio.setAttribute("webkit-playsinline", "");

  let persistentAudioGeneration = 0;
  let persistentAudioUrl = "";

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

    if (!force && !appState.listeningReviewMode && hasPlayedListeningQuestion(question.id)) {
      listeningPlaybackPhase = "review-answer";
      updateListeningPlaybackUi();
      return;
    }

    if (!skipInstruction && needsGrade2ListeningInstruction(question)) {
      await playGrade2ListeningInstruction(question);
      return;
    }

    // Keep the existing browser-speech fallback for data that has no audio file.
    if (!question.audioFile) {
      await originalPlayListeningAudio({ force, skipInstruction: true });
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
      markListeningQuestionPlayed(questionId);
      listeningPlaybackPhase = "audio";
      updateListeningPlaybackUi();
    };

    persistentListeningAudio.onended = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      persistentListeningAudio.onended = null;
      if (appState.listeningReviewMode) {
        listeningPlaybackPhase = "review";
      } else {
        startListeningAnswerCountdown(question);
      }
      saveState();
      updateListeningPlaybackUi();
    };

    persistentListeningAudio.onerror = () => {
      if (!isCurrentPersistentPlayback(generation, questionId)) return;
      persistentListeningAudio.onerror = null;
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

  mountListeningAudio = function mountListeningAudioWithPersistentElement() {
    if (["answer", "review", "review-answer"].includes(listeningPlaybackPhase)) {
      updateListeningPlaybackUi();
      return;
    }
    void playListeningAudio();
  };
})();
