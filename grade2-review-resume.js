(() => {
  "use strict";

  if (window.APP_CONFIG?.mode !== "grade2-product" || typeof appState === "undefined" || !appState.scored || appState.modal === "complete") return;

  const historyKey = `${storageNamespace}-${selectedSet.key}-attempt-history-v1`;
  const activeViewKey = `${historyKey}:active-view`;

  try {
    const history = JSON.parse(localStorage.getItem(historyKey) || "null");
    if (!history?.initial?.state) return;

    let activeId = "";
    try { activeId = sessionStorage.getItem(activeViewKey) || ""; } catch {}

    let attempt = activeId === "initial"
      ? history.initial
      : history.fullAttempts?.find((item) => item.id === activeId);

    if (!attempt?.state) attempt = history.fullAttempts?.at(-1) || history.initial;
    if (!attempt?.state) return;

    const restored = JSON.parse(JSON.stringify(attempt.state));
    Object.keys(appState).forEach((key) => delete appState[key]);
    Object.assign(appState, restored);
    appState.started = true;
    appState.scored = true;
    appState.modal = "complete";

    try { sessionStorage.setItem(activeViewKey, attempt.id || "initial"); } catch {}
    render();
  } catch {
    // A broken or manually edited history record must never prevent the exam from loading.
  }
})();
