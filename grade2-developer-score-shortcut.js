(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const isGrade2DeveloperMode =
    window.APP_CONFIG?.mode === "grade2-product" &&
    window.APP_CONFIG?.grade === "grade2" &&
    params.get("dev") === "1";

  if (!isGrade2DeveloperMode || typeof window.moveToDeveloperLocation !== "function") return;
  if (document.querySelector("[data-developer-score-shortcut]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "developer-score-shortcut";
  button.dataset.developerScoreShortcut = "1";
  button.textContent = "採点画面を見る";
  button.setAttribute("aria-label", "開発者用の採点・回答解説画面を開く");

  button.addEventListener("click", () => {
    window.moveToDeveloperLocation("result");
  });

  document.body.appendChild(button);
})();
