(() => {
  "use strict";

  const PROVIDERS = Object.freeze([
    Object.freeze({ id: "chatgpt", label: "ChatGPT", href: "https://chatgpt.com/", mark: "C" }),
    Object.freeze({ id: "gemini", label: "Gemini", href: "https://gemini.google.com/", mark: "G" }),
    Object.freeze({ id: "claude", label: "Claude", href: "https://claude.ai/", mark: "C" }),
    Object.freeze({ id: "perplexity", label: "Perplexity", href: "https://www.perplexity.ai/", mark: "P" }),
  ]);

  const app = document.getElementById("app");
  if (!app) return;

  let patchQueued = false;
  let audioSaveRequested = false;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function providerLinks() {
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

  function normalizeGradingMessageText(value) {
    return String(value || "")
      .replaceAll("採点JSON", "採点結果")
      .replaceAll("JSON", "採点データ")
      .replace("GPTの回答から有効な採点データを見つけられませんでした。", "AIの回答から採点結果を読み取れませんでした。");
  }

  function normalizeRecoveryButtonCopy() {
    const button = app.querySelector('[data-action="copy-grade2-json-output-prompt"]');
    if (!button) return;
    const text = button.textContent || "";
    if (text.includes("JSON再出力")) {
      button.textContent = text.replace("JSON再出力の指示", "AIに形式を整えてもらう指示");
    }
  }

  function cleanSpeakingCompletion() {
    const frame = app.querySelector(".grade2-speaking-flow");
    if (!frame || !frame.querySelector(".speaking-section-complete")) return;

    frame.querySelector('[data-action="grade2-speaking-download-all"]')?.remove();
    frame.querySelector('[data-action="grade2-speaking-copy-grading-prompt"]')?.remove();
    frame.querySelectorAll(".speaking-download-note").forEach((node) => node.remove());
    frame.querySelector(".speaking-review-list.compact-list")?.remove();

    const actions = frame.querySelector(".speaking-primary-actions");
    if (actions && !frame.querySelector(".grade2-ai-deferred-note")) {
      const note = document.createElement("p");
      note.className = "grade2-ai-deferred-note";
      note.textContent = "採点対象の録音はこの端末内に保存されています。AI採点は4技能をすべて終えた後の結果画面から行えます。";
      actions.insertAdjacentElement("afterend", note);
    }
  }

  function patchAccessPlanLink() {
    app.querySelectorAll('a.access-plan-link[href*="bonus.html"]').forEach((link) => {
      link.textContent = "特典を開く（8ページPDF・Writing / Speaking AI採点）";
    });
  }

  function patchPendingScoreCopy() {
    app.querySelectorAll(".grade2-raw-score-grid .result-card").forEach((card) => {
      const label = card.querySelector("span")?.textContent?.trim() || "";
      const small = card.querySelector("small");
      if (!small) return;
      if (label === "4. Writing" && /JSON|採点待ち/.test(small.textContent || "")) {
        small.textContent = "AI採点結果を反映すると表示";
      }
      if (label === "5. Speaking" && /Read Aloud|採点/.test(small.textContent || "")) {
        small.textContent = "Read Aloud・No.1〜4をAIで採点";
      }
    });

    const pending = app.querySelector(".score-pending-note");
    if (pending) pending.textContent = "WritingとSpeakingのAI採点結果を反映すると、4技能の練習用CSEレンジと合格レベル目安を表示します。";
  }

  function patchGradingPanel() {
    const panel = app.querySelector(".grade2-gpt-panel");
    if (!panel || panel.classList.contains("grade2-ai-flow-card")) return;

    const isPremium = Boolean(panel.querySelector('[data-action="copy-grade2-grading-data"]'));
    const imported = Boolean(panel.querySelector(".gpt-imported-badge"));
    const previousDraft = panel.querySelector("[data-grade2-gpt-score-draft]")?.value || "";
    const previousMessage = panel.querySelector(".grading-message");
    const previousMessageText = previousMessage ? normalizeGradingMessageText(previousMessage.textContent) : "";
    const previousMessageHtml = previousMessageText
      ? `<div class="${escapeHtml(previousMessage.className)}">${escapeHtml(previousMessageText)}</div>`
      : "";

    panel.classList.add("grade2-ai-flow-card");

    if (!isPremium && !imported) {
      panel.innerHTML = `
        <div class="grade2-ai-flow-head">
          <div><span>3回プレミアム特典</span><h2>Writing・Speaking AI採点</h2></div>
        </div>
        <p class="grade2-ai-flow-intro">WritingとSpeakingのAI採点は3回プレミアムで利用できます。</p>`;
      return;
    }

    panel.innerHTML = `
      <div class="grade2-ai-flow-head">
        <div>
          <span>3回プレミアム特典</span>
          <h2>Writing・Speaking AI採点</h2>
        </div>
        <strong class="${imported ? "grade2-ai-status done" : "grade2-ai-status pending"}">${imported ? "採点結果反映済み" : "AI採点待ち"}</strong>
      </div>
      <p class="grade2-ai-flow-intro">普段使っているAIで、WritingとSpeakingをまとめて採点できます。必要な操作だけを上から順に進めてください。</p>

      <div class="grade2-ai-step-list">
        <section class="grade2-ai-step" aria-labelledby="grade2-ai-step1-title">
          <div class="grade2-ai-step-number" aria-hidden="true">1</div>
          <div class="grade2-ai-step-body">
            <h3 id="grade2-ai-step1-title">スピーキング音声を保存</h3>
            <p>採点対象は Read Aloud と No.1〜4 の5音声です。マイクテストとWarm-upは採点しません。</p>
            <button class="start-button compact grade2-ai-primary" type="button" data-action="grade2-speaking-download-all">${audioSaveRequested ? "5音声の保存をもう一度試す" : "採点用5音声を保存"}</button>
            <details class="grade2-ai-help">
              <summary>保存できない場合</summary>
              <p>ブラウザが複数ファイルの保存を止めることがあります。その場合は許可を確認するか、ページ下部のスピーキング復習欄から5音声を個別に保存してください。</p>
            </details>
          </div>
        </section>

        <section class="grade2-ai-step" aria-labelledby="grade2-ai-step2-title">
          <div class="grade2-ai-step-number" aria-hidden="true">2</div>
          <div class="grade2-ai-step-body">
            <h3 id="grade2-ai-step2-title">AIで採点</h3>
            <p>まず採点データをコピーし、そのあと普段使っているAIを新しいタブで開きます。コピーした内容を貼り、STEP 1で保存した5音声を追加してください。</p>
            <button class="start-button compact grade2-ai-primary" type="button" data-action="copy-grade2-grading-data">採点データをコピー</button>
            <div class="grade2-ai-provider-grid" aria-label="採点に使う外部AI">
              ${providerLinks()}
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
              <textarea data-grade2-gpt-score-draft spellcheck="false" placeholder="AIの回答をそのまま貼り付けてください。">${escapeHtml(previousDraft)}</textarea>
            </label>
            <button class="start-button compact grade2-ai-primary" type="button" data-action="import-grade2-gpt-score">採点結果を反映する</button>
            ${previousMessageHtml}
            <details class="grade2-ai-help">
              <summary>うまく採点結果を読み取れない場合</summary>
              <p>AIの回答形式が崩れた場合だけ、下のボタンで再出力用の指示をコピーし、同じAIへ貼り付けてください。</p>
              <button class="small-action" type="button" data-action="copy-grade2-json-output-prompt">AIに形式を整えてもらう指示をコピー</button>
            </details>
          </div>
        </section>
      </div>

      <div class="grade2-ai-safety-note">
        <strong>答案や録音はCBTから外部AIへ自動送信されません。</strong>
        <span>自分で選んだAIへ手動で渡します。実名・学校名などの個人情報は入力しないでください。採点は学習用の参考評価であり、英検の公式採点・公式CSE・公式合否ではありません。</span>
      </div>`;
  }

  function patch() {
    patchQueued = false;
    cleanSpeakingCompletion();
    patchAccessPlanLink();
    patchPendingScoreCopy();
    normalizeRecoveryButtonCopy();
    patchGradingPanel();
  }

  function schedulePatch() {
    if (patchQueued) return;
    patchQueued = true;
    queueMicrotask(patch);
  }

  app.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (action === "grade2-speaking-download-all") {
      audioSaveRequested = true;
      schedulePatch();
    }
  });

  const observer = new MutationObserver(schedulePatch);
  observer.observe(app, { childList: true, subtree: true });
  patch();
})();
