(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const requestedPlan = String(params.get("plan") || "").trim().toLowerCase();
  const hasAccess = requestedPlan === "three" || requestedPlan === "five";
  const content = document.querySelector("[data-bonus-content]");
  const locked = document.querySelector("[data-bonus-locked]");

  if (requestedPlan === "five" && window.history?.replaceState) {
    const normalized = new URL(window.location.href);
    normalized.searchParams.set("plan", "three");
    window.history.replaceState(null, "", normalized.toString());
  }

  document.querySelectorAll("[data-exam-link]").forEach((link) => {
    link.setAttribute("href", "./exam.html?plan=three");
  });

  if (content) content.hidden = !hasAccess;
  if (locked) locked.hidden = hasAccess;
})();
