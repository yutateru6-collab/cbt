(function initGrade2Scoring(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.Grade2Scoring = Object.freeze(api);
})(typeof globalThis !== "undefined" ? globalThis : this, function createGrade2Scoring() {
  "use strict";

  const GPT_SCHEMA = "scbt-grade2-gpt-score-v1";
  const CSE_BANDS = Object.freeze([
    Object.freeze({ minPercent: 0, maxPercent: 39.999999, low: 0, high: 449 }),
    Object.freeze({ minPercent: 40, maxPercent: 49.999999, low: 400, high: 479 }),
    Object.freeze({ minPercent: 50, maxPercent: 59.999999, low: 440, high: 509 }),
    Object.freeze({ minPercent: 60, maxPercent: 69.999999, low: 480, high: 539 }),
    Object.freeze({ minPercent: 70, maxPercent: 79.999999, low: 510, high: 574 }),
    Object.freeze({ minPercent: 80, maxPercent: 89.999999, low: 545, high: 609 }),
    Object.freeze({ minPercent: 90, maxPercent: 99.999999, low: 580, high: 639 }),
    Object.freeze({ minPercent: 100, maxPercent: 100, low: 620, high: 650 }),
  ]);

  function estimateCseRange(rawScore, maximumScore) {
    const raw = Number(rawScore);
    const maximum = Number(maximumScore);
    if (!Number.isFinite(raw) || !Number.isFinite(maximum) || maximum <= 0 || raw < 0 || raw > maximum) {
      throw new RangeError("素点と満点の値が不正です。");
    }
    const percent = raw === maximum ? 100 : (raw / maximum) * 100;
    const band = CSE_BANDS.find((item) => percent >= item.minPercent && percent <= item.maxPercent);
    if (!band) throw new RangeError("CSE目安の帯を判定できませんでした。");
    return { raw, maximum, percent, low: band.low, high: band.high };
  }

  function sumRanges(ranges) {
    const safeRanges = Array.isArray(ranges) ? ranges : [];
    return safeRanges.reduce(
      (total, range) => ({ low: total.low + Number(range.low || 0), high: total.high + Number(range.high || 0) }),
      { low: 0, high: 0 },
    );
  }

  function classifyLevel(primaryRange, speakingRange) {
    if (!primaryRange || !speakingRange) return { key: "pending", label: "GPT採点待ち" };
    if (primaryRange.high < 1520 || speakingRange.high < 460) {
      return { key: "below", label: "合格ライン未満の目安" };
    }
    if (primaryRange.low >= 1520 && speakingRange.low >= 460) {
      return { key: "pass", label: "2級合格レベル目安" };
    }
    return { key: "borderline", label: "ボーダー目安" };
  }

  function extractJsonCandidates(text) {
    const source = String(text || "").trim();
    const candidates = [];
    const fencedPattern = /```(?:json)?\s*([\s\S]*?)```/gi;
    let fencedMatch;
    while ((fencedMatch = fencedPattern.exec(source))) {
      const candidate = fencedMatch[1].trim();
      if (candidate) candidates.push(candidate);
    }
    if (source) candidates.push(source);

    for (let start = 0; start < source.length; start += 1) {
      if (source[start] !== "{") continue;
      let depth = 0;
      let inString = false;
      let escaped = false;
      for (let index = start; index < source.length; index += 1) {
        const character = source[index];
        if (inString) {
          if (escaped) escaped = false;
          else if (character === "\\") escaped = true;
          else if (character === '"') inString = false;
          continue;
        }
        if (character === '"') inString = true;
        else if (character === "{") depth += 1;
        else if (character === "}") {
          depth -= 1;
          if (depth === 0) {
            candidates.push(source.slice(start, index + 1));
            break;
          }
        }
      }
    }
    return [...new Set(candidates)];
  }

  function extractGptScorePayload(text) {
    let firstObject = null;
    for (const candidate of extractJsonCandidates(text)) {
      try {
        const parsed = JSON.parse(candidate);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
        if (parsed.schema === GPT_SCHEMA) return parsed;
        if (!firstObject) firstObject = parsed;
      } catch {
        // Try the next complete JSON candidate.
      }
    }
    if (firstObject) return firstObject;
    throw new SyntaxError("GPTの回答から有効なJSONを見つけられませんでした。");
  }

  function validateInteger(errors, value, path, minimum, maximum) {
    if (!Number.isInteger(value)) {
      errors.push(`${path} は整数で入力してください。`);
      return false;
    }
    if (value < minimum || value > maximum) {
      errors.push(`${path} は ${minimum}〜${maximum} の範囲で入力してください。`);
      return false;
    }
    return true;
  }

  function validateWritingTask(errors, task, path) {
    if (!task || typeof task !== "object" || Array.isArray(task)) {
      errors.push(`${path} がありません。`);
      return;
    }
    const criterionKeys = ["content", "organization", "vocabulary", "grammar"];
    const validCriteria = criterionKeys.map((key) => validateInteger(errors, task[key], `${path}.${key}`, 0, 4));
    const validTotal = validateInteger(errors, task.total, `${path}.total`, 0, 16);
    if (validTotal && validCriteria.every(Boolean)) {
      const calculated = criterionKeys.reduce((sum, key) => sum + task[key], 0);
      if (task.total !== calculated) errors.push(`${path}.total が4観点の合計 ${calculated} と一致しません。`);
    }
  }

  function validateGptScorePayload(payload, expectedSetKey) {
    const errors = [];
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, errors: ["採点JSONはオブジェクト形式にしてください。"], value: null };
    }
    if (payload.schema !== GPT_SCHEMA) errors.push(`schema は ${GPT_SCHEMA} にしてください。`);
    if (payload.setKey !== expectedSetKey) errors.push(`回次が一致しません。${expectedSetKey} の採点JSONを貼り付けてください。`);

    const writing = payload.writing;
    if (!writing || typeof writing !== "object" || Array.isArray(writing)) {
      errors.push("writing がありません。");
    } else {
      validateWritingTask(errors, writing.summary, "writing.summary");
      validateWritingTask(errors, writing.essay, "writing.essay");
      const validWritingTotal = validateInteger(errors, writing.total, "writing.total", 0, 32);
      if (validWritingTotal && writing.summary && writing.essay && Number.isInteger(writing.summary.total) && Number.isInteger(writing.essay.total)) {
        const calculated = writing.summary.total + writing.essay.total;
        if (writing.total !== calculated) errors.push(`writing.total が2課題の合計 ${calculated} と一致しません。`);
      }
    }

    const speaking = payload.speaking;
    if (!speaking || typeof speaking !== "object" || Array.isArray(speaking)) {
      errors.push("speaking がありません。");
    } else {
      const speakingKeys = ["taskResponse", "contentAndInformation", "pronunciationAndFluency", "vocabularyAndGrammar"];
      const validCriteria = speakingKeys.map((key) => validateInteger(errors, speaking[key], `speaking.${key}`, 0, 5));
      const validSpeakingTotal = validateInteger(errors, speaking.total, "speaking.total", 0, 20);
      if (validSpeakingTotal && validCriteria.every(Boolean)) {
        const calculated = speakingKeys.reduce((sum, key) => sum + speaking[key], 0);
        if (speaking.total !== calculated) errors.push(`speaking.total が4観点の合計 ${calculated} と一致しません。`);
      }
    }

    return { ok: errors.length === 0, errors, value: errors.length === 0 ? payload : null };
  }

  function parseAndValidateGptScore(text, expectedSetKey) {
    try {
      return validateGptScorePayload(extractGptScorePayload(text), expectedSetKey);
    } catch (error) {
      return { ok: false, errors: [error.message || "採点JSONを読み取れませんでした。"], value: null };
    }
  }

  function summarizeScores({ reading, listening, gptScores = null }) {
    const readingRange = estimateCseRange(reading.correct, reading.total);
    const listeningRange = estimateCseRange(listening.correct, listening.total);
    if (!gptScores) {
      return {
        reading: readingRange,
        listening: listeningRange,
        readingListening: { raw: reading.correct + listening.correct, maximum: reading.total + listening.total },
        writing: null,
        speaking: null,
        primary: null,
        overall: null,
        level: classifyLevel(null, null),
      };
    }
    const writingRange = estimateCseRange(gptScores.writing.total, 32);
    const speakingRange = estimateCseRange(gptScores.speaking.total, 20);
    const primary = sumRanges([readingRange, listeningRange, writingRange]);
    const overall = sumRanges([readingRange, listeningRange, writingRange, speakingRange]);
    return {
      reading: readingRange,
      listening: listeningRange,
      readingListening: { raw: reading.correct + listening.correct, maximum: reading.total + listening.total },
      writing: writingRange,
      speaking: speakingRange,
      primary,
      overall,
      level: classifyLevel(primary, speakingRange),
    };
  }

  return {
    GPT_SCHEMA,
    CSE_BANDS,
    estimateCseRange,
    sumRanges,
    classifyLevel,
    extractGptScorePayload,
    validateGptScorePayload,
    parseAndValidateGptScore,
    summarizeScores,
  };
});
