(() => {
  const threeSetPausesRelease = "20260817-grade2-sets01-03-listening-pauses-1s-v1";
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
      question.audioFile = `./audio-r2/grade2/releases/${threeSetPausesRelease}/${set.key}/listening/${partFolder}/No${number}.wav`;
      question.audioRelease = threeSetPausesRelease;
    });
  });
})();
