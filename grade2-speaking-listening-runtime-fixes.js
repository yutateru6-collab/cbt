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

  // The first app.js render happens before this patch script. Re-render only if the
  // current screen is Listening; Speaking auto-start is intentionally left untouched.
  if (appState.started && appState.module === "listening") render();
})();
