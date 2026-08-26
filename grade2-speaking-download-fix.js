(() => {
  "use strict";

  // Keep this late override after the AI grading flow so Speaking-end downloads remain visible.
  if (typeof window.renderGrade2SpeakingReviewV2 !== "function") return;

  function escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderSpeakingEndDownloads() {
    const scoredSteps = getGrade2ScoredSpeakingSteps();
    const missing = scoredSteps.filter(({ index }) => !appState.speakingRecordings[index]);
    const allReady = scoredSteps.length === 5 && missing.length === 0;

    return `
      <section class="grade2-gpt-panel grade2-ai-flow-card grade2-speaking-end-downloads" aria-label="スピーキング録音の保存">
        <div class="grade2-ai-step-body">
          <h3>録音を端末へ保存</h3>
          <p>Read Aloud と No.1〜4 の録音を、ブラウザ標準のダウンロード先へ保存できます。</p>
          <div class="grade2-ai-audio-status ${allReady ? "is-ready" : "is-missing"}">
            <strong>${allReady ? "採点対象の5音声がそろっています" : "録音を確認してください"}</strong>
            <span>${allReady ? "Read Aloud / No.1 / No.2 / No.3 / No.4" : `未保存：${escape(missing.map(({ step }) => step.label).join("、"))}`}</span>
          </div>
          <button class="start-button compact grade2-ai-primary" type="button" data-action="grade2-speaking-download-all" ${allReady ? "" : "disabled"}>5音声をまとめてダウンロード</button>
          <details class="grade2-ai-help" open>
            <summary>1件ずつ保存する</summary>
            <p>ブラウザが複数ファイルの保存を止める場合は、下のボタンから1件ずつ保存してください。</p>
            <div class="grade2-ai-individual-downloads">
              ${scoredSteps
                .map(({ step, index }) => {
                  const recording = appState.speakingRecordings[index];
                  return `
                    <div class="grade2-ai-individual-row">
                      <span><strong>${escape(step.label)}</strong><small>${recording ? formatBytes(recording.size || 0) : "録音なし"}</small></span>
                      ${recording ? `<button class="small-action" type="button" data-action="speaking-record-download" data-step="${index}">個別ダウンロード</button>` : `<span class="grade2-ai-missing-record">未保存</span>`}
                    </div>`;
                })
                .join("")}
            </div>
          </details>
        </div>
      </section>`;
  }

  window.renderGrade2SpeakingReviewV2 = function renderGrade2SpeakingReviewWithDownloads() {
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
        </div>`;
    }

    return `
      <div class="speaking-section-complete">
        <div>
          <h3>スピーキングは終了しました</h3>
          <p>録音はこの端末内に保存されています。本番形式では、そのままリスニングへ進みます。</p>
        </div>
      </div>
      ${missingLabels.length ? `<p class="speaking-record-message error">未保存の採点対象録音：${escape(missingLabels.join("、"))}</p>` : ""}
      ${appState.speakingRecordMessage ? `<p class="speaking-record-message">${escape(appState.speakingRecordMessage)}</p>` : ""}
      <div class="speaking-primary-actions">
        <button class="start-button compact" data-action="grade2-speaking-continue">そのままリスニングへ進む（本番形式）</button>
        <button class="small-action" data-action="grade2-speaking-break">一旦休憩する（練習用・本番には休憩なし）</button>
      </div>
      ${renderSpeakingEndDownloads()}
      <p class="grade2-ai-deferred-note">AI採点は4技能をすべて終えた後の結果画面から行えます。ここでは録音を保存するか、そのまま試験を続けてください。</p>`;
  };
})();
