(() => {
  const questionGapRelease = "20260817-set01-listening-q1-q5-question-gap-v1";
  const existingFixRelease = "20260817-set01-listening-q5-q9-fix-v1";
  const questionGapBase = `./audio-r2/grade2/releases/${questionGapRelease}/set-01/listening/part1`;
  const existingFixBase = `./audio-r2/grade2/releases/${existingFixRelease}/set-01/listening/part1`;
  const questionGapIds = new Set([1, 2, 3, 4, 5]);
  const existingFixIds = new Set([6, 7, 8, 9]);
  const sets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const set01 = sets.find((set) => set?.key === "set-01");
  if (!set01 || !Array.isArray(set01.listeningQuestions)) return;

  set01.listeningQuestions.forEach((question) => {
    const id = Number(question?.id);
    if (question?.part !== "Part 1") return;
    if (questionGapIds.has(id)) {
      question.audioFile = `${questionGapBase}/No${String(id).padStart(2, "0")}.wav`;
      question.audioRelease = questionGapRelease;
      return;
    }
    if (existingFixIds.has(id)) {
      question.audioFile = `${existingFixBase}/No${String(id).padStart(2, "0")}.wav`;
      question.audioRelease = existingFixRelease;
    }
  });
})();
