(() => {
  const targetSecondsByLabel = Object.freeze({
    "Silent Reading": 20,
    "Read Aloud": 60,
    "No.1": 30,
    "No.2": 90,
    "No.3": 35,
    "No.4": 35,
  });

  const sets = Array.isArray(window.scbtGrade2SpeakingSets) ? window.scbtGrade2SpeakingSets : [];
  for (const set of sets) {
    const steps = Array.isArray(set?.speakingSteps) ? set.speakingSteps : [];
    for (const step of steps) {
      if (Object.hasOwn(targetSecondsByLabel, step.label)) {
        step.seconds = targetSecondsByLabel[step.label];
      }
    }
  }

  const librarySet = sets.find((set) =>
    (set?.speakingSteps || []).some((step) => String(step?.cardTitle || "").includes("Borrowing Tools from Libraries")),
  );
  if (!librarySet) return;

  const correctedPassage =
    "Some people need tools for small repairs at home, but they do not want to buy tools they will rarely use. To help these people, some libraries that have tool-lending programs provide hammers and other simple equipment. Residents can borrow tools from such libraries instead of buying them. In this way, they can finish repairs without buying new tools. These services also help communities reduce waste and share resources.";
  const correctedAnswer = "By borrowing tools from libraries that have tool-lending programs.";

  for (const step of librarySet.speakingSteps || []) {
    if (["Silent Reading", "Read Aloud", "No.1"].includes(step.label)) {
      step.cardText = correctedPassage;
    }
    if (step.label === "No.1") {
      step.modelAnswer = correctedAnswer;
      step.answerEvidence = "such libraries → libraries that have tool-lending programs";
    }
  }
})();
