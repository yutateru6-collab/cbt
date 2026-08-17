(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  if (params.get("dev") !== "1") return;

  const canonical = window.Grade2CanonicalContent;
  if (!canonical) return;

  const panel = document.createElement("aside");
  panel.id = "grade2-explanation-provenance";
  panel.setAttribute("aria-label", "開発用・解説データ確認");
  panel.style.cssText = [
    "position:fixed",
    "left:max(8px,env(safe-area-inset-left))",
    "right:max(8px,env(safe-area-inset-right))",
    "bottom:calc(8px + env(safe-area-inset-bottom))",
    "z-index:2147483646",
    "padding:8px 10px",
    "border:1px solid rgba(15,23,42,.22)",
    "border-radius:10px",
    "background:rgba(255,255,255,.96)",
    "box-shadow:0 8px 24px rgba(15,23,42,.16)",
    "font:600 11px/1.45 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    "color:#334155",
    "pointer-events:none",
    "word-break:break-all",
  ].join(";");
  document.body.appendChild(panel);

  let scheduled = false;
  let lastText = "";

  function normalizeSetKey(value) {
    const raw = String(value || "set-01").trim();
    const match = raw.match(/(?:set-?)?(\d{1,2})$/i);
    if (match) return `set-${String(Number(match[1])).padStart(2, "0")}`;
    return raw || "set-01";
  }

  function normalizeId(value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return String(numeric).padStart(2, "0");
    return String(value || "unknown")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown";
  }

  function lookupEntry() {
    const url = new URL(window.location.href);
    const setKey = normalizeSetKey(url.searchParams.get("set") || "set-01");
    const moduleKey = url.searchParams.get("module") || "";

    if (["reading", "listening", "writing"].includes(moduleKey)) {
      const id = url.searchParams.get("question");
      if (!id) return null;
      return canonical.registry?.[`grade2:${setKey}:${moduleKey}:${normalizeId(id)}`] || null;
    }

    if (moduleKey === "speaking") {
      const index = Math.max(0, Number(url.searchParams.get("speakingStep")) || 0);
      const set = canonical.speakingSets?.find((item) => item?.key === setKey);
      const step = set?.speakingSteps?.[index];
      return step?.questionKey ? canonical.registry?.[step.questionKey] || null : null;
    }

    return null;
  }

  function render() {
    scheduled = false;
    const entry = lookupEntry();
    const text = entry
      ? `解説確認｜${entry.questionKey}｜${entry.status}｜${entry.source}｜v:${entry.version}｜hash:${entry.hash}`
      : `解説確認｜canonical:${canonical.ready ? "ready" : "ERROR"}｜305:${canonical.paidChoiceCount}｜issues:${canonical.issues?.length || 0}`;
    if (text === lastText) return;
    lastText = text;
    panel.textContent = text;
  }

  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(render);
  }

  const app = document.getElementById("app");
  if (app) new MutationObserver(scheduleRender).observe(app, { childList: true, subtree: true });
  window.addEventListener("popstate", scheduleRender);
  window.addEventListener("hashchange", scheduleRender);
  scheduleRender();
})();
