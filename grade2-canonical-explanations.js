(() => {
  "use strict";

  const VERSION = "20260817-v1";
  const PAID_SET_KEYS = new Set(["set-01", "set-02", "set-03", "set-04", "set-05"]);

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function hashText(value) {
    const text = String(value || "");
    let hash = 0x811c9dc5;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
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

  function makeKey(setKey, moduleKey, id) {
    return `grade2:${setKey}:${moduleKey}:${normalizeId(id)}`;
  }

  function isWeakGenericExplanation(value) {
    const text = String(value || "").trim();
    if (!text) return true;
    if (/^正答は?\s*\d+です。?[\s\S]*(?:に当たる内容を選びます|本文では.+説明されています)/.test(text)) return true;
    if (/^文脈から[「『]?.+[」』]?が最も自然です。?[\s\S]*前後関係と選択肢の意味を確認しましょう/.test(text)) return true;
    if (/^(?:正答|正解|答え)[:：は ]*\d+[。.]?$/.test(text)) return true;
    return false;
  }

  function inferSource(setKey, moduleKey, id, item) {
    if (item?.explanationSyncVersion) return "grade2-explanation-sync.js";
    if (moduleKey === "listening") {
      if (setKey === "set-01") return "grade2-set-01-explanations.js";
      return "grade2-skill-explanations.js";
    }
    if (moduleKey === "writing") {
      if (setKey === "set-01") return "grade2-set-01-explanations.js";
      return "grade2-skill-explanations.js";
    }
    if (moduleKey === "speaking") return "grade2-explanation-sync.js";
    if (moduleKey === "reading") {
      if (setKey === "sample" && [19, 22].includes(Number(id))) return "grade2-explanation-sync.js";
      if (setKey === "set-01" && Number(id) === 1) return "grade2-set-01-explanations.js";
      return setKey === "sample" ? "grade2-set-01.js" : "grade2-vocab-sets.js";
    }
    return "unknown";
  }

  function qualityStatus(setKey, moduleKey, explanation) {
    const text = String(explanation || "").trim();
    if (!text) return { status: "missing", reason: "explanation is empty" };
    if (isWeakGenericExplanation(text)) return { status: "legacy", reason: "generic legacy explanation pattern" };

    if (PAID_SET_KEYS.has(setKey) && moduleKey === "listening") {
      if (!text.includes("【聞き取りの決め手】")) {
        return { status: "invalid", reason: "listening explanation has no evidence section" };
      }
      if (!/【(?:誤答分析|誤答の見分け方)】/.test(text)) {
        return { status: "invalid", reason: "listening explanation has no distractor analysis" };
      }
    }

    if (PAID_SET_KEYS.has(setKey) && moduleKey === "reading" && text.length < 40) {
      return { status: "invalid", reason: "reading explanation is too short to show a reason" };
    }

    if (PAID_SET_KEYS.has(setKey) && ["writing", "speaking"].includes(moduleKey) && !text.includes("【")) {
      return { status: "invalid", reason: `${moduleKey} explanation is not a structured guide` };
    }

    return { status: "canonical", reason: "passed canonical explanation checks" };
  }

  const registry = {};
  const issues = [];
  let paidChoiceCount = 0;

  function annotateItem(setKey, moduleKey, item, id) {
    if (!item || typeof item !== "object") return;
    const explanation = String(item.explanation || "").trim();
    const key = makeKey(setKey, moduleKey, id);
    const result = qualityStatus(setKey, moduleKey, explanation);
    const source = inferSource(setKey, moduleKey, id, item);
    const hash = hashText(explanation);

    item.questionKey = key;
    item.canonicalExplanation = result.status === "canonical" ? explanation : "";
    item.explanationStatus = result.status;
    item.explanationSource = source;
    item.explanationVersion = VERSION;
    item.explanationHash = hash;

    registry[key] = {
      questionKey: key,
      setKey,
      module: moduleKey,
      id: String(id),
      status: result.status,
      source,
      version: VERSION,
      hash,
      reason: result.reason,
    };

    if (PAID_SET_KEYS.has(setKey) && result.status !== "canonical") {
      issues.push({ questionKey: key, source, status: result.status, reason: result.reason });
      item.explanation = `解説データの整合性エラー（${key}）。この問題では古い解説を表示しません。`;
      item.canonicalExplanation = item.explanation;
      item.explanationStatus = "blocked";
      item.explanationHash = hashText(item.explanation);
      registry[key] = {
        ...registry[key],
        status: "blocked",
        hash: item.explanationHash,
        reason: `blocked from display: ${result.reason}`,
      };
    }
  }

  function annotateSet(setKey, data) {
    for (const page of data?.readingPages || []) {
      for (const question of page.questions || []) {
        annotateItem(setKey, "reading", question, question.id);
        if (PAID_SET_KEYS.has(setKey)) paidChoiceCount += 1;
      }
    }
    for (const question of data?.listeningQuestions || []) {
      annotateItem(setKey, "listening", question, question.id);
      if (PAID_SET_KEYS.has(setKey)) paidChoiceCount += 1;
    }
    for (const task of data?.writingTasks || []) {
      annotateItem(setKey, "writing", task, task.id ?? task.kind ?? "writing");
    }
  }

  const sample = window.scbtGrade2Set01 || {};
  const sets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const speakingSets = Array.isArray(window.scbtGrade2SpeakingSets) ? window.scbtGrade2SpeakingSets : [];

  annotateSet("sample", sample);
  for (const set of sets) annotateSet(set?.key || "unknown", set);

  for (const speakingSet of speakingSets) {
    const setKey = speakingSet?.key || "unknown";
    for (let index = 0; index < (speakingSet?.speakingSteps || []).length; index += 1) {
      const step = speakingSet.speakingSteps[index];
      annotateItem(setKey, "speaking", step, step.id || step.label || `step-${index + 1}`);
    }
  }

  if (paidChoiceCount !== 305) {
    issues.push({
      questionKey: "grade2:paid:choice-count",
      source: "grade2-canonical-explanations.js",
      status: "invalid",
      reason: `expected 305 paid reading/listening questions but resolved ${paidChoiceCount}`,
    });
  }

  const resolvedSample = cloneJson(sample);
  const resolvedSets = cloneJson(sets);
  const resolvedSpeakingSets = cloneJson(speakingSets);
  const ready = issues.length === 0;

  window.Grade2CanonicalContent = Object.freeze({
    version: VERSION,
    ready,
    paidChoiceCount,
    issues: Object.freeze(cloneJson(issues)),
    registry: Object.freeze(cloneJson(registry)),
    sample: resolvedSample,
    sets: resolvedSets,
    speakingSets: resolvedSpeakingSets,
  });
  window.GRADE2_CANONICAL_READY = ready;

  // Downstream consumers (exam-data.js and isolated tools) receive only the
  // post-resolution snapshot. They no longer need to understand override order.
  window.scbtGrade2Set01 = resolvedSample;
  window.scbtGrade2VocabSets = resolvedSets;
  window.scbtGrade2SpeakingSets = resolvedSpeakingSets;
})();
