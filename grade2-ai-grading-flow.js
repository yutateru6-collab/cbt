(() => {
  "use strict";

  const PROVIDERS = Object.freeze([
    Object.freeze({ id: "chatgpt", label: "ChatGPT", href: "https://chatgpt.com/", mark: "C" }),
    Object.freeze({ id: "gemini", label: "Gemini", href: "https://gemini.google.com/", mark: "G" }),
    Object.freeze({ id: "claude", label: "Claude", href: "https://claude.ai/", mark: "C" }),
    Object.freeze({ id: "perplexity", label: "Perplexity", href: "https://www.perplexity.ai/", mark: "P" }),
  ]);

  const root = document.getElementById("app");
  if (!root || typeof window.render !== "function") return;

  function escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeGradingMessage(value) {
    let text = String(value || "");
    if (!text) return "";
    text = text.replace("採点JSONを取り込みました。", "採点結果を反映しました。");
    text = text.replace("GPTの回答から有効なJSONを見つけられませんでした。", "AIの回答から採点結果を読み取れませんでした。");
    text = text.replaceAll("採点JSON", "採点結果").replaceAll("JSON", "採点データ");
    if (/schema|writing\.|speaking\.|オブジェクト形式/.test(text)) {
      return "取り込めませんでした：AIの回答形式を確認できませんでした。下の「うまく採点結果を読み取れない場合」をお試しください。";
    }
    return text;
  }

  function renderProviderLinks() {
    return PROVIDERS.map(
      (provider) => `
        <a
          class="grade2-ai-provider"
          href="${provider.href}"
          target="_blank"
          rel="noopener noreferrer"
          referrerpolicy="no-referrer"
          data-grade2-ai-provider="${provider.id}"
        >
          <span class="grade2-ai-provider-mark" aria-hidden="true">${provider.mark}</span>
          <span><strong>${provider.label}</strong><small>新しいタブで開く</small></span>
        </a>`,
    ).join("");
  }

  function renderAudioPreparation() {
    const scoredSteps = getGrade2ScoredSpeakingSteps();
    const missing = scoredSteps.filter(({ index }) => !appState.speakingRecordings[index]);
    const allReady = missing.length === 0;

    return `
      <div class="grade2-ai-audio-status ${allReady ? "is-ready" : "is-missing"}">
        <strong>${allReady ? "採点対象の5音声がそろっています" : "採点用の録音を確認してください"}</strong>
        <span>${allReady ? "Read Aloud / No.1 / No.2 / No.3 / No.4" : `未保存：${escape(missing.map(({ step }) => step.label).join("、"))}`}</span>
      </div>
      <button class="start-button compact grade2-ai-primary" type="button" data-action="grade2-speaking-download-all" ${allReady ? "" : "disabled"}>採点用5音声を保存</button>
      <details class="grade2-ai-help">
        <summary>一括保存できない場合</summary>
        <p>ブラウザが複数ファイルの保存を止めることがあります。その場合は下から1件ずつ保存してください。</p>
        <div class="grade2-ai-individual-downloads">
          ${scoredSteps
            .map(({ step, index }) => {
              const recording = appState.speakingRecordings[index];
              return `
                <div class="grade2-ai-individual-row">
                  <span><strong>${escape(step.label)}</strong><small>${recording ? formatBytes(recording.size || 0) : "録音なし"}</small></span>
                  ${recording ? `<button class="small-action" type="button" data-action="speaking-record-download" data-step="${index}">個別保存</button>` : `<span class="grade2-ai-missing-record">未保存</span>`}
                </div>`;
            })
            .join("")}
        </div>
      </details>`;
  }

  window.getValidatedGrade2GptScores = function getValidatedGrade2GptScoresV81() {
    if (!canViewBonus || !grade2Scoring || !appState.grade2GptScores) return null;
    const validation = grade2Scoring.validateGptScorePayload(appState.grade2GptScores, selectedSet.key);
    return validation.ok ? validation.value : null;
  };

  window.renderAccessPlanNotice = function renderAccessPlanNoticeV81() {
    const accessText = selectedAccessPlan.key === "sample"
      ? "スピーキングから始まり、4技能の主要な操作を少しずつ無料で確認できます。"
      : selectedAccessPlan.key === "three"
        ? "第1〜3回の解説・スクリプト・模範解答と、3回プレミアム特典を確認できます。"
        : "第1回を本番形式で解き、正答を確認できます。詳しい解説は3回プレミアムに含まれます。";
    const bonusLink = canViewBonus
      ? `<a class="access-plan-link" href="./bonus.html?plan=three" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">特典を開く（8ページPDF・Writing / Speaking AI採点）</a>`
      : "";
    const developerLink = `<a class="developer-entry-link" href="./exam.html?plan=three&set=set-01&dev=1&module=speaking&speakingStep=0&start=1&fresh=1">開発者用確認</a>`;

    return `
      <section class="access-plan-notice ${canViewExplanations ? "is-three" : "is-single"}" aria-label="利用プラン">
        <div>
          <span>利用プラン</span>
          <strong>${escape(selectedAccessPlan.label)}</strong>
        </div>
        <p>${accessText}</p>
        ${bonusLink}
        ${developerLink}
      </section>`;
  };

  window.renderGrade2SpeakingReviewV2 = function renderGrade2SpeakingReviewV81() {
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
      <p class="grade2-ai-deferred-note">AI採点は4技能をすべて終えた後の結果画面から行えます。ここでは操作せず、そのまま試験を続けてください。</p>`;
  };

  window.renderGrade2SpeakingFeedbackBenefit = function renderGrade2SpeakingFeedbackBenefitV81() {
    return "";
  };

  window.renderGrade2ScoreResult = function renderGrade2ScoreResultV81(summary) {
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
          <article class="result-card ${gptScores ? "gpt-scored" : "gpt-pending"}"><span>4. Writing</span><strong>${gptScores ? `${gptScores.writing.total}/32` : "AI採点待ち"}</strong><small>${gptScores ? `要約 ${gptScores.writing.summary.total}/16・英作文 ${gptScores.writing.essay.total}/16` : "AI採点結果を反映すると表示"}</small></article>
          <article class="result-card ${gptScores ? "gpt-scored" : "gpt-pending"}"><span>5. Speaking</span><strong>${gptScores ? `${gptScores.speaking.total}/20` : "AI採点待ち"}</strong><small>${gptScores ? "学習用4観点の素点" : "Read Aloud・No.1〜4をAIで採点"}</small></article>
        </div>
        ${gptScores ? renderGrade2CseRanges(scoreView) : `<p class="score-pending-note">WritingとSpeakingのAI採点結果を反映すると、4技能の練習用CSEレンジと合格レベル目安を表示します。</p>`}
      </section>
      ${renderGrade2GptPanel(gptScores)}
      <div class="result-review-actions">
        <button class="small-action" data-action="listen-review-open">リスニングを個別復習する</button>
      </div>`;
  };

  window.renderGrade2GptPanel = function renderGrade2GptPanelV81(gptScores) {
    if (!canViewBonus) {
      return `
        <section class="grade2-gpt-panel grade2-ai-flow-card" aria-label="Writing・Speaking AI採点">
          <div class="grade2-ai-flow-head">
            <div><span>3回プレミアム特典</span><h2>Writing・Speaking AI採点</h2></div>
          </div>
          <p class="grade2-ai-flow-intro">WritingとSpeakingのAI採点は3回プレミアムで利用できます。</p>
        </section>`;
    }

    const messageText = normalizeGradingMessage(appState.grade2GptScoreMessage);
    const messageClass = gptScores && messageText ? "success" : "error";
    return `
      <section class="grade2-gpt-panel grade2-ai-flow-card" aria-label="Writing・Speaking AI採点">
        <div class="grade2-ai-flow-head">
          <div>
            <span>3回プレミアム特典</span>
            <h2>Writing・Speaking AI採点</h2>
          </div>
          <strong class="${gptScores ? "grade2-ai-status done" : "grade2-ai-status pending"}">${gptScores ? "採点結果反映済み" : "AI採点待ち"}</strong>
        </div>
        <p class="grade2-ai-flow-intro">普段使っているAIで、WritingとSpeakingをまとめて採点できます。必要な操作だけを上から順に進めてください。</p>

        <div class="grade2-ai-step-list">
          <section class="grade2-ai-step" aria-labelledby="grade2-ai-step1-title">
            <div class="grade2-ai-step-number" aria-hidden="true">1</div>
            <div class="grade2-ai-step-body">
              <h3 id="grade2-ai-step1-title">スピーキング音声を保存</h3>
              <p>採点対象は Read Aloud と No.1〜4 の5音声です。マイクテストとWarm-upは採点しません。</p>
              ${renderAudioPreparation()}
            </div>
          </section>

          <section class="grade2-ai-step" aria-labelledby="grade2-ai-step2-title">
            <div class="grade2-ai-step-number" aria-hidden="true">2</div>
            <div class="grade2-ai-step-body">
              <h3 id="grade2-ai-step2-title">AIで採点</h3>
              <p>まず採点データをコピーし、そのあと普段使っているAIを新しいタブで開きます。コピーした内容を貼り、STEP 1で保存した5音声を追加してください。</p>
              <button class="start-button compact grade2-ai-primary" type="button" data-action="copy-grade2-grading-data">採点データをコピー</button>
              <div class="grade2-ai-provider-grid" aria-label="採点に使う外部AI">
                ${renderProviderLinks()}
              </div>
              <p class="grade2-ai-provider-note">音声ファイルを直接確認できるかは、サービス・モデル・プランによって異なります。音声を確認できないAIには、発音や流暢さを推測させないでください。</p>
            </div>
          </section>

          <section class="grade2-ai-step" aria-labelledby="grade2-ai-step3-title">
            <div class="grade2-ai-step-number" aria-hidden="true">3</div>
            <div class="grade2-ai-step-body">
              <h3 id="grade2-ai-step3-title">AIの回答を戻す</h3>
              <p>AIが返した回答を、説明文も含めてそのまま貼り付けて大丈夫です。必要な採点データだけをアプリ側で読み取ります。</p>
              <label class="grade2-ai-response-input">
                <span>AIの回答をここに貼り付け</span>
                <textarea data-grade2-gpt-score-draft spellcheck="false" placeholder="AIの回答をそのまま貼り付けてください。">${escape(appState.grade2GptScoreDraft)}</textarea>
              </label>
              <button class="start-button compact grade2-ai-primary" type="button" data-action="import-grade2-gpt-score">採点結果を反映する</button>
              ${messageText ? `<div class="grading-message ${messageClass}">${escape(messageText)}</div>` : ""}
              <details class="grade2-ai-help">
                <summary>うまく採点結果を読み取れない場合</summary>
                <p>AIの回答形式が崩れた場合だけ、下のボタンで再出力用の指示をコピーし、同じAIへ貼り付けてください。</p>
                <button class="small-action" type="button" data-grade2-ai-recovery>AIに形式を整えてもらう指示をコピー</button>
              </details>
            </div>
          </section>
        </div>

        <div class="grade2-ai-safety-note">
          <strong>答案や録音はCBTから外部AIへ自動送信されません。</strong>
          <span>自分で選んだAIへ手動で渡します。実名・学校名などの個人情報は入力しないでください。採点は学習用の参考評価であり、英検の公式採点・公式CSE・公式合否ではありません。</span>
        </div>
      </section>`;
  };

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-grade2-ai-recovery]");
    if (!button) return;
    const copied = await copyTextToClipboard(getGrade2JsonOutputPrompt());
    button.textContent = copied ? "AIに形式を整えてもらう指示をコピーしました" : "コピーできませんでした。文章を選択してください";
  });

  const currentSpeakingStep = appState.module === "speaking" ? speakingSteps[appState.speakingStep] : null;
  const safeToRefresh = !appState.started || appState.modal === "complete" || currentSpeakingStep?.phase === "review";
  if (safeToRefresh) window.render();
})();
