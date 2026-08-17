(() => {
  "use strict";

  const containers = [
    { key: "sample", data: window.scbtGrade2Set01 || null },
    ...(Array.isArray(window.scbtGrade2VocabSets)
      ? window.scbtGrade2VocabSets.map((data) => ({ key: data?.key || "unknown", data }))
      : []),
  ];

  let removed = 0;

  for (const { data } of containers) {
    for (const question of data?.listeningQuestions || []) {
      if (Object.prototype.hasOwnProperty.call(question, "explanation")) {
        delete question.explanation;
        removed += 1;
      }
      delete question.explanationTier;
      delete question.explanationSource;
      delete question.explanationVersion;
      delete question.explanationHash;
      delete question.canonicalExplanation;
    }
  }

  window.GRADE2_LEGACY_LISTENING_EXPLANATIONS_REMOVED = Object.freeze({
    removed,
    reason: "Raw listening explanations are legacy input only. Display explanations must be rebuilt by the canonical explanation pipeline.",
  });
})();
