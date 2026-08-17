(() => {
  const oneSecondPausesRelease = "20260817-set01-listening-q1-q5-intro-bodyq-1s-v1";
  const existingFixRelease = "20260817-set01-listening-q5-q9-fix-v1";
  const oneSecondPausesBase = `./audio-r2/grade2/releases/${oneSecondPausesRelease}/set-01/listening/part1`;
  const existingFixBase = `./audio-r2/grade2/releases/${existingFixRelease}/set-01/listening/part1`;
  const oneSecondPausesIds = new Set([1, 2, 3, 4, 5]);
  const existingFixIds = new Set([6, 7, 8, 9]);
  const sets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const set01 = sets.find((set) => set?.key === "set-01");
  if (!set01 || !Array.isArray(set01.listeningQuestions)) return;

  set01.listeningQuestions.forEach((question) => {
    const id = Number(question?.id);
    if (question?.part !== "Part 1") return;
    if (oneSecondPausesIds.has(id)) {
      question.audioFile = `${oneSecondPausesBase}/No${String(id).padStart(2, "0")}.wav`;
      question.audioRelease = oneSecondPausesRelease;
      return;
    }
    if (existingFixIds.has(id)) {
      question.audioFile = `${existingFixBase}/No${String(id).padStart(2, "0")}.wav`;
      question.audioRelease = existingFixRelease;
    }
  });
})();
