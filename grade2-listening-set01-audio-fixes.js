(() => {
  const release = "20260817-set01-listening-q5-q9-fix-v1";
  const base = `./audio-r2/grade2/releases/${release}/set-01/listening/part1`;
  const targetIds = new Set([5, 6, 7, 8, 9]);
  const sets = Array.isArray(window.scbtGrade2VocabSets) ? window.scbtGrade2VocabSets : [];
  const set01 = sets.find((set) => set?.key === "set-01");
  if (!set01 || !Array.isArray(set01.listeningQuestions)) return;

  set01.listeningQuestions.forEach((question) => {
    const id = Number(question?.id);
    if (question?.part !== "Part 1" || !targetIds.has(id)) return;
    question.audioFile = `${base}/No${String(id).padStart(2, "0")}.wav`;
    question.audioRelease = release;
  });
})();
