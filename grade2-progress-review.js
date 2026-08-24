(() => {
  "use strict";

  if (
    window.APP_CONFIG?.mode !== "grade2-product" ||
    typeof appState === "undefined" ||
    typeof readingPages === "undefined" ||
    typeof listeningQuestions === "undefined"
  ) return;

  const root = document.getElementById("app");
  if (!root) return;

  let activeDialog = null;
  let scheduled = false;
  let previousBodyOverflow = "";

  function escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function hasOwnAnswer(answers, id) {
    return Object.prototype.hasOwnProperty.call(answers || {}, id) && Number(answers[id]) > 0;
  }

  function getChoiceTextSafe(question, number) {
    if (!Number.isInteger(Number(number)) || Number(number) <= 0) return "";
    try {
      if (typeof getChoiceText === "function") return String(getChoiceText(question, Number(number)) || "");
    } catch {}
    const choices = Array.isArray(question?.choices) ? question.choices : [];
    return String(choices[Number(number) - 1] ?? "");
  }

  function getStatus(question, answers) {
    const selected = Number(answers?.[question.id]) || 0;
    if (!selected) return "unanswered";
    if (!Number.isInteger(question.correct)) return "neutral";
    return selected === question.correct ? "correct" : "wrong";
  }

  function statusLabel(status) {
    return {
      correct: "正解",
      wrong: "不正解",
      unanswered: "未解答",
      neutral: "確認",
    }[status] || "確認";
  }

  function getReadingProgressQuestions() {
    const currentPageIndex = Math.max(0, Math.min(Number(appState.readingPage) || 0, readingPages.length - 1));
    const currentPage = readingPages[currentPageIndex];
    let currentStart = Number(appState.readingItemIndex) || 0;
    try {
      if (typeof getCurrentReadingItemIndex === "function") currentStart = getCurrentReadingItemIndex(currentPage);
    } catch {}

    const answers = appState.answers?.written || {};
    const scoped = [];
    readingPages.forEach((page, pageIndex) => {
      (page?.questions || []).forEach((question, questionIndex) => {
        if (pageIndex < currentPageIndex) {
          scoped.push(question);
          return;
        }
        if (pageIndex > currentPageIndex) return;
        if (questionIndex < currentStart || hasOwnAnswer(answers, question.id)) scoped.push(question);
      });
    });
    return scoped;
  }

  function getListeningProgressQuestions() {
    const answers = appState.answers?.listening || {};
    const currentIndex = Math.max(0, Math.min(Number(appState.listeningIndex) || 0, listeningQuestions.length - 1));
    return listeningQuestions.filter((question, index) => index < currentIndex || (index === currentIndex && hasOwnAnswer(answers, question.id)));
  }

  function getQuestions(skill, completed) {
    if (skill === "reading") {
      return completed
        ? readingPages.flatMap((page) => page?.questions || [])
        : getReadingProgressQuestions();
    }
    if (skill === "listening") {
      return completed ? [...listeningQuestions] : getListeningProgressQuestions();
    }
    return [];
  }

  function getAnswers(skill) {
    return skill === "reading" ? appState.answers?.written || {} : appState.answers?.listening || {};
  }

  function renderExplanation(question, selected, skill) {
    if (typeof canViewExplanations !== "undefined" && !canViewExplanations) return "";
    let body = "";
    try {
      if (typeof renderReviewChoices === "function") body += renderReviewChoices(question, selected) || "";
    } catch {}
    try {
      if (typeof renderReviewExplanation === "function") body += renderReviewExplanation(question) || "";
    } catch {}
    if (skill === "listening" && question?.script) {
      body += `<div class="grade2-progress-review-script"><strong>Script</strong><p>${escape(question.script)}</p></div>`;
    }
    if (!body) return "";
    return `<details class="grade2-progress-review-details"><summary>詳しい確認</summary><div>${body}</div></details>`;
  }

  function renderCard(question, answers, skill) {
    const selected = Number(answers?.[question.id]) || 0;
    const status = getStatus(question, answers);
    const prompt = skill === "listening"
      ? question.questionText || question.text || `No.${question.id}`
      : question.text || `No.${question.id}`;
    const selectedText = selected ? `${selected}. ${getChoiceTextSafe(question, selected)}` : "未解答";
    const correctText = Number.isInteger(question.correct)
      ? `${question.correct}. ${getChoiceTextSafe(question, question.correct)}`
      : "正答未設定";

    return `
      <article class="grade2-progress-review-card is-${status}" data-progress-review-question="${escape(question.id)}">
        <div class="grade2-progress-review-card-head">
          <span>No.${escape(question.id)}</span>
          <strong>${escape(statusLabel(status))}</strong>
        </div>
        <p class="grade2-progress-review-question">${escape(prompt)}</p>
        <dl class="grade2-progress-review-answers">
          <div><dt>あなたの答え</dt><dd>${escape(selectedText)}</dd></div>
          <div><dt>正解</dt><dd>${escape(correctText)}</dd></div>
        </dl>
        ${renderExplanation(question, selected, skill)}
      </article>`;
  }

  function closeReview() {
    if (!activeDialog) return;
    activeDialog.remove();
    activeDialog = null;
    document.body.style.overflow = previousBodyOverflow;
  }

  function openChoiceReview(skill, { completed = false } = {}) {
    closeReview();
    const questions = getQuestions(skill, completed);
    const answers = getAnswers(skill);
    const counts = { correct: 0, wrong: 0, unanswered: 0, neutral: 0 };
    questions.forEach((question) => {
      const status = getStatus(question, answers);
      counts[status] = (counts[status] || 0) + 1;
    });
    const label = skill === "reading" ? "Reading" : "Listening";
    const subtitle = completed ? `${label} 終了時点` : "今までに通過・回答した範囲";
    const cards = questions.map((question) => renderCard(question, answers, skill)).join("");

    const overlay = document.createElement("div");
    overlay.className = "grade2-progress-review-overlay";
    overlay.dataset.progressReviewModal = skill;
    overlay.innerHTML = `
      <section class="grade2-progress-review-dialog" role="dialog" aria-modal="true" aria-labelledby="grade2-progress-review-title">
        <header class="grade2-progress-review-head">
          <div>
            <span>${escape(subtitle)}</span>
            <h2 id="grade2-progress-review-title">${escape(label)} 答え合わせ</h2>
          </div>
          <button type="button" class="grade2-progress-review-close" data-progress-review-close aria-label="答え合わせを閉じる">×</button>
        </header>
        <div class="grade2-progress-review-summary">
          <span>正解 <strong>${counts.correct}</strong></span>
          <span>不正解 <strong>${counts.wrong}</strong></span>
          <span>未解答 <strong>${counts.unanswered}</strong></span>
        </div>
        <p class="grade2-progress-review-note">この確認画面では回答データを書き換えません。閉じると同じ位置から続けられます。</p>
        <div class="grade2-progress-review-list">
          ${cards || '<div class="grade2-progress-review-empty"><strong>まだ確認できる問題がありません。</strong><p>回答した問題、または通過した問題がここに表示されます。</p></div>'}
        </div>
        <footer class="grade2-progress-review-foot">
          <button type="button" class="start-button compact" data-progress-review-close>確認を閉じて続ける</button>
        </footer>
      </section>`;

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay || event.target.closest?.("[data-progress-review-close]")) closeReview();
    });
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.appendChild(overlay);
    activeDialog = overlay;
    overlay.querySelector("[data-progress-review-close]")?.focus();
  }

  function makeEntry(skill, completed) {
    const entry = document.createElement("div");
    entry.className = `grade2-progress-review-entry ${completed ? "is-completed" : ""}`;
    entry.dataset.progressReviewEntry = `${skill}-${completed ? "completed" : "progress"}`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "grade2-progress-review-open";
    button.dataset.progressReviewOpen = skill;
    button.dataset.progressReviewCompleted = completed ? "1" : "0";
    button.textContent = completed ? "この技能を答え合わせ" : "ここまで答え合わせ";
    const note = document.createElement("small");
    note.textContent = completed ? "確認してから次の技能へ進めます" : "未来の問題は表示しません";
    entry.append(button, note);
    return entry;
  }

  function enhanceReading() {
    const frame = root.querySelector(".reading-frame");
    if (!frame || frame.querySelector('[data-progress-review-entry="reading-progress"]')) return;
    const next = frame.querySelector('.nav-button.next[data-action="reading-next"]');
    if (!next) return;
    next.insertAdjacentElement("beforebegin", makeEntry("reading", false));
  }

  function enhanceListening() {
    const frame = root.querySelector(".listen-frame");
    if (!frame || frame.querySelector('[data-progress-review-entry="listening-progress"]')) return;
    const anchor = frame.querySelector(".section-description") || frame.firstElementChild;
    if (!anchor) return;
    anchor.insertAdjacentElement("afterend", makeEntry("listening", false));
  }

  function enhanceSkillBreak() {
    const section = root.querySelector("[data-skill-break]");
    if (!section || section.querySelector("[data-progress-review-entry]")) return;
    const headline = section.querySelector("span")?.textContent || "";
    const skill = /Listening/i.test(headline) ? "listening" : /Reading/i.test(headline) ? "reading" : "";
    if (!skill) return;
    const continueButton = section.querySelector("[data-skill-break-continue]");
    if (!continueButton) return;
    continueButton.insertAdjacentElement("beforebegin", makeEntry(skill, true));
  }

  function enhance() {
    scheduled = false;
    if (activeDialog && !document.body.contains(activeDialog)) activeDialog = null;
    enhanceReading();
    enhanceListening();
    enhanceSkillBreak();
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(enhance);
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-progress-review-open]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    openChoiceReview(button.dataset.progressReviewOpen, {
      completed: button.dataset.progressReviewCompleted === "1",
    });
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeDialog) closeReview();
  });

  new MutationObserver(scheduleEnhance).observe(root, { childList: true, subtree: true });
  scheduleEnhance();
})();
