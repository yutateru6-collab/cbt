(() => {
  const threeSetPausesRelease = "20260817-grade2-sets01-03-listening-pauses-1s-v1";
  const no05DuplicateFixRelease = "20260820-set01-listening-no05-duplicate-question-fix-v1";
  const duplicateQuestionFixV2Release = "20260817-set01-listening-duplicate-question-fix-v2";
  const duplicateQuestionFixIds = new Set([6, 7, 8, 10, 12, 14]);
  const productionSetKeys = new Set(["set-01", "set-02", "set-03"]);
  const sets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];

  sets.forEach((set) => {
    if (!productionSetKeys.has(set?.key) || !Array.isArray(set.listeningQuestions)) return;

    set.listeningQuestions.forEach((question) => {
      const id = Number(question?.id);
      const partFolder = question?.part === "Part 1" ? "part1" : question?.part === "Part 2" ? "part2" : "";
      const validPart = (partFolder === "part1" && id >= 1 && id <= 15) || (partFolder === "part2" && id >= 16 && id <= 30);
      if (!Number.isInteger(id) || !validPart) return;

      const number = String(id).padStart(2, "0");
      const useNo05DuplicateFix = set.key === "set-01" && partFolder === "part1" && id === 5;
      const useDuplicateFix = set.key === "set-01" && partFolder === "part1" && duplicateQuestionFixIds.has(id);
      const release = useNo05DuplicateFix
        ? no05DuplicateFixRelease
        : useDuplicateFix
          ? duplicateQuestionFixV2Release
          : threeSetPausesRelease;
      question.audioFile = `./audio-r2/grade2/releases/${release}/${set.key}/listening/${partFolder}/No${number}.wav`;
      question.audioRelease = release;
    });
  });
})();
