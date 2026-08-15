const test = require("node:test");
const assert = require("node:assert/strict");
const scoring = require("../grade2-scoring.js");

function validPayload(overrides = {}) {
  return {
    schema: scoring.GPT_SCHEMA,
    setKey: "set-01",
    writing: {
      summary: { content: 4, organization: 4, vocabulary: 4, grammar: 4, total: 16 },
      essay: { content: 4, organization: 4, vocabulary: 4, grammar: 4, total: 16 },
      total: 32,
    },
    speaking: {
      taskResponse: 5,
      contentAndInformation: 5,
      pronunciationAndFluency: 5,
      vocabularyAndGrammar: 5,
      total: 20,
    },
    ...overrides,
  };
}

test("CSE目安表の境界と満点をそのまま返す", () => {
  assert.deepEqual(scoring.estimateCseRange(0, 100), { raw: 0, maximum: 100, percent: 0, low: 0, high: 449 });
  assert.deepEqual(scoring.estimateCseRange(40, 100), { raw: 40, maximum: 100, percent: 40, low: 400, high: 479 });
  assert.deepEqual(scoring.estimateCseRange(60, 100), { raw: 60, maximum: 100, percent: 60, low: 480, high: 539 });
  assert.deepEqual(scoring.estimateCseRange(100, 100), { raw: 100, maximum: 100, percent: 100, low: 620, high: 650 });
});

test("全問正解と全問未解答を集計する", () => {
  const perfect = scoring.summarizeScores({ reading: { correct: 31, total: 31 }, listening: { correct: 30, total: 30 }, gptScores: validPayload() });
  assert.deepEqual(perfect.readingListening, { raw: 61, maximum: 61 });
  assert.deepEqual(perfect.primary, { low: 1860, high: 1950 });
  assert.deepEqual(perfect.overall, { low: 2480, high: 2600 });
  assert.equal(perfect.level.key, "pass");

  const empty = scoring.summarizeScores({ reading: { correct: 0, total: 31 }, listening: { correct: 0, total: 30 } });
  assert.deepEqual(empty.readingListening, { raw: 0, maximum: 61 });
  assert.equal(empty.level.key, "pending");
});

test("一次1520・Speaking460付近は重なりをボーダー判定する", () => {
  assert.equal(scoring.classifyLevel({ low: 1510, high: 1580 }, { low: 450, high: 490 }).key, "borderline");
  assert.equal(scoring.classifyLevel({ low: 1520, high: 1600 }, { low: 460, high: 500 }).key, "pass");
  assert.equal(scoring.classifyLevel({ low: 1400, high: 1519 }, { low: 500, high: 550 }).key, "below");
  assert.equal(scoring.classifyLevel({ low: 1600, high: 1700 }, { low: 400, high: 459 }).key, "below");
});

test("コードフェンス付きJSONを抽出・検証できる", () => {
  const result = scoring.parseAndValidateGptScore(`診断です。\n\`\`\`json\n${JSON.stringify(validPayload(), null, 2)}\n\`\`\``, "set-01");
  assert.equal(result.ok, true);
  assert.equal(result.value.writing.total, 32);
});

test("説明用JSONより固定schemaの採点JSONを優先する", () => {
  const result = scoring.parseAndValidateGptScore(
    `説明用データ: {"note":"参考"}\n\`\`\`json\n${JSON.stringify(validPayload())}\n\`\`\``,
    "set-01",
  );
  assert.equal(result.ok, true);
  assert.equal(result.value.schema, scoring.GPT_SCHEMA);
});

test("GPT最低点も有効", () => {
  const payload = validPayload({
    writing: {
      summary: { content: 0, organization: 0, vocabulary: 0, grammar: 0, total: 0 },
      essay: { content: 0, organization: 0, vocabulary: 0, grammar: 0, total: 0 },
      total: 0,
    },
    speaking: { taskResponse: 0, contentAndInformation: 0, pronunciationAndFluency: 0, vocabularyAndGrammar: 0, total: 0 },
  });
  assert.equal(scoring.validateGptScorePayload(payload, "set-01").ok, true);
});

test("回次違い・範囲外・小数・合計不一致を拒否する", () => {
  assert.equal(scoring.validateGptScorePayload(validPayload(), "set-02").ok, false);

  const invalid = validPayload();
  invalid.writing.summary.content = 5;
  invalid.writing.essay.grammar = 3.5;
  invalid.speaking.taskResponse = 6;
  const result = scoring.validateGptScorePayload(invalid, "set-01");
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /0〜4/);
  assert.match(result.errors.join("\n"), /整数/);
  assert.match(result.errors.join("\n"), /0〜5/);

  const mismatched = validPayload();
  mismatched.writing.total = 31;
  mismatched.speaking.total = 19;
  const mismatchResult = scoring.validateGptScorePayload(mismatched, "set-01");
  assert.equal(mismatchResult.ok, false);
  assert.match(mismatchResult.errors.join("\n"), /合計/);
});

test("必須採点項目の欠落を拒否する", () => {
  const missingWriting = validPayload();
  delete missingWriting.writing.summary;
  const writingResult = scoring.validateGptScorePayload(missingWriting, "set-01");
  assert.equal(writingResult.ok, false);
  assert.match(writingResult.errors.join("\n"), /writing\.summary/);

  const missingSpeaking = validPayload();
  delete missingSpeaking.speaking;
  const speakingResult = scoring.validateGptScorePayload(missingSpeaking, "set-01");
  assert.equal(speakingResult.ok, false);
  assert.match(speakingResult.errors.join("\n"), /speaking がありません/);
});

test("壊れたJSONを日本語エラーにする", () => {
  const result = scoring.parseAndValidateGptScore("```json\n{bad}\n```", "set-01");
  assert.equal(result.ok, false);
  assert.match(result.errors[0], /JSON/);
});
