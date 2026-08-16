const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const patchSource = fs.readFileSync(path.join(root, "grade2-listening-persistent-audio.js"), "utf8");
const examSource = fs.readFileSync(path.join(root, "exam.html"), "utf8");
const prepareSource = fs.readFileSync(path.join(root, "scripts", "prepare-worker-assets.mjs"), "utf8");
const swSource = fs.readFileSync(path.join(root, "sw.js"), "utf8");
const examSwSource = fs.readFileSync(path.join(root, "sw-set02-v2.js"), "utf8");

function createPersistentAudioContext({ introducedSections = { part1: true } } = {}) {
  const audioInstances = [];

  class FakeAudio {
    constructor() {
      this.src = "";
      this.currentTime = 0;
      this.volume = 1;
      this.dataset = {};
      this.paused = true;
      this.onplaying = null;
      this.onended = null;
      this.onerror = null;
      audioInstances.push(this);
    }

    setAttribute() {}
    pause() { this.paused = true; }
    load() {}
    async play() {
      this.paused = false;
      this.onplaying?.();
    }
    finish() {
      this.paused = true;
      const handler = this.onended;
      handler?.();
    }
  }

  const context = {
    Audio: FakeAudio,
    URL,
    document: { baseURI: "https://example.test/exam.html" },
    window: {
      location: { href: "https://example.test/exam.html" },
      speechSynthesis: { cancel() {}, speak() {} },
    },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance() {},
  };
  vm.createContext(context);

  vm.runInContext(`
    const LISTENING_ANSWER_SECONDS = 10;
    const isGrade2DeveloperMode = true;
    const GRADE2_LISTENING_INSTRUCTION_AUDIO = { part1: "intro.wav", part2: "intro2.wav" };
    const listeningQuestions = [
      { id: 1, part: "Part 1", section: "第1部", audioFile: "q1.wav" },
      { id: 2, part: "Part 1", section: "第1部", audioFile: "q2.wav" },
      { id: 16, part: "Part 2", section: "第2部", audioFile: "q16.wav" },
    ];
    const appState = {
      module: "listening",
      started: true,
      modal: null,
      listeningIndex: 0,
      listeningIntroducedSections: ${JSON.stringify(introducedSections)},
      listeningPlayedQuestionIds: {},
      listeningReviewMode: false,
      listeningAnswerRemaining: 10,
      listeningAnswerDeadline: 0,
      listeningCountdownQuestionId: null,
      speakingOutputVolume: 70,
    };
    let listeningAudioElement = null;
    let listeningInstructionAudioElement = null;
    let listeningSpeechUtterance = null;
    let listeningPlaybackQuestionId = 1;
    let listeningPlaybackPhase = "audio";
    let listeningAnswerDeadline = 0;
    let listeningPlaybackStarts = 0;
    let listeningPlaybackToken = 0;
    let listeningAudioPlaybackToken = 0;
    let cancelListeningCountdownCalls = 0;
    let grade2SpeakingActivationToken = 0;
    let grade2SpeakingDeadline = 0;
    function getListeningAudioVolume() { return 0.7; }
    function getGrade2ListeningSectionKey(question) { return question?.part === "Part 1" ? "part1" : "part2"; }
    function needsGrade2ListeningInstruction(question) {
      if (appState.listeningReviewMode) return false;
      const sectionKey = getGrade2ListeningSectionKey(question);
      return Boolean(sectionKey && !appState.listeningIntroducedSections[sectionKey]);
    }
    function hasPlayedListeningQuestion(id) { return Boolean(appState.listeningPlayedQuestionIds[id]); }
    function markListeningQuestionPlayed(id) { appState.listeningPlayedQuestionIds[id] = true; }
    function updateListeningPlaybackUi() {}
    function saveState() {}
    function syncDeveloperLocationUrl() {}
    function isModuleAvailable(moduleKey) { return moduleKey === "listening"; }
    function isListeningAnswerCountdownActive(question = listeningQuestions[appState.listeningIndex]) {
      return Boolean(
        !appState.listeningReviewMode &&
        question &&
        String(appState.listeningCountdownQuestionId) === String(question.id) &&
        Number(appState.listeningAnswerDeadline) > 0
      );
    }
    function cancelListeningAnswerCountdown() {
      cancelListeningCountdownCalls += 1;
      listeningAnswerDeadline = 0;
      appState.listeningAnswerDeadline = 0;
      appState.listeningCountdownQuestionId = null;
    }
    function resetListeningAnswerCountdown() {
      appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
      cancelListeningAnswerCountdown();
    }
    function startListeningAnswerCountdown(question = listeningQuestions[appState.listeningIndex]) {
      listeningPlaybackPhase = "answer";
      appState.listeningAnswerRemaining = 10;
      listeningAnswerDeadline = 12345;
      appState.listeningAnswerDeadline = listeningAnswerDeadline;
      appState.listeningCountdownQuestionId = question.id;
    }
    async function playGrade2ListeningInstruction() { return false; }
    async function playListeningAudio() {}
    function mountListeningAudio() {}
    function stopListeningPlayback() {}
    async function replayListeningAudioForDeveloper() {}

    function render() {
      stopListeningPlayback({ preserveCountdown: true });
      const question = listeningQuestions[appState.listeningIndex];
      const resumingCountdown = isListeningAnswerCountdownActive(question);
      if (listeningPlaybackQuestionId !== question.id) {
        stopListeningPlayback({ preserveCountdown: resumingCountdown });
        listeningPlaybackQuestionId = question.id;
        if (appState.listeningReviewMode) {
          listeningPlaybackPhase = "review";
        } else if (resumingCountdown) {
          listeningPlaybackPhase = "answer";
        } else if (hasPlayedListeningQuestion(question.id)) {
          listeningPlaybackPhase = "review-answer";
        } else if (needsGrade2ListeningInstruction(question)) {
          listeningPlaybackPhase = "instruction";
        } else {
          listeningPlaybackPhase = question.audioFile ? "audio" : "blocked";
        }
      }
      mountListeningAudio();
    }

    function moveToDeveloperLocation(value) {
      const parts = String(value || "").split(":");
      const moduleKey = parts[0];
      stopListeningPlayback();
      grade2SpeakingActivationToken += 1;
      grade2SpeakingDeadline = 0;
      appState.started = true;
      appState.modal = null;
      if (moduleKey === "listening" && isModuleAvailable("listening")) {
        appState.module = "listening";
        appState.listeningIndex = Math.min(Math.max(Number(parts[1]) || 0, 0), listeningQuestions.length - 1);
        appState.listeningAnswerRemaining = LISTENING_ANSWER_SECONDS;
      } else {
        return;
      }
      saveState();
      syncDeveloperLocationUrl();
      render();
    }
  `, context);

  vm.runInContext(patchSource, context);
  return { context, audioInstances };
}

test("Grade 2 exam ships and precaches the persistent listening audio layer", () => {
  assert.match(examSource, /grade2-listening-persistent-audio\.js\?v=grade2-ios-listening-v3/);
  assert.ok(prepareSource.includes('"grade2-listening-persistent-audio.js"'));
  assert.ok(swSource.includes('"/grade2-listening-persistent-audio.js"'));
  assert.ok(examSwSource.includes('"/grade2-listening-persistent-audio.js"'));
  assert.match(swSource, /cbt-grade2-app-shell-v74-listening-dev-preview/);
  assert.match(examSwSource, /cbt-grade2-app-shell-v74-listening-dev-preview/);
});

test("listening reuses one Audio element when advancing between questions", async () => {
  const { context, audioInstances } = createPersistentAudioContext();

  await vm.runInContext("playListeningAudio()", context);

  assert.equal(audioInstances.length, 1);
  const persistentAudio = audioInstances[0];
  assert.match(persistentAudio.src, /\/q1\.wav$/);

  persistentAudio.finish();
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "answer");

  vm.runInContext(`
    appState.listeningIndex = 1;
    cancelListeningAnswerCountdown();
    stopListeningPlayback();
    listeningPlaybackQuestionId = 2;
    listeningPlaybackPhase = "audio";
  `, context);
  await vm.runInContext("playListeningAudio()", context);

  assert.equal(audioInstances.length, 1, "a second Audio element must not be created for No.2");
  assert.match(persistentAudio.src, /\/q2\.wav$/);
});

test("Part 1 instruction plays once and No.2 starts without replaying it", async () => {
  const { context, audioInstances } = createPersistentAudioContext({ introducedSections: {} });

  await vm.runInContext("playListeningAudio()", context);
  assert.equal(audioInstances.length, 1);
  const persistentAudio = audioInstances[0];
  assert.match(persistentAudio.src, /\/intro\.wav$/);

  persistentAudio.finish();
  await Promise.resolve();
  assert.equal(vm.runInContext("appState.listeningIntroducedSections.part1", context), true);
  assert.match(persistentAudio.src, /\/q1\.wav$/);

  persistentAudio.finish();
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "answer");

  vm.runInContext(`
    appState.listeningIndex = 1;
    cancelListeningAnswerCountdown();
    stopListeningPlayback();
    listeningPlaybackQuestionId = 2;
    listeningPlaybackPhase = "audio";
  `, context);
  await vm.runInContext("playListeningAudio()", context);

  assert.match(persistentAudio.src, /\/q2\.wav$/);
  assert.equal(vm.runInContext("appState.listeningIntroducedSections.part1", context), true);
});

test("persistent stop preserves an active answer countdown only when requested", () => {
  const { context } = createPersistentAudioContext();

  vm.runInContext(`
    listeningPlaybackQuestionId = 1;
    listeningPlaybackPhase = "answer";
    listeningAnswerDeadline = 99999;
    appState.listeningAnswerDeadline = 99999;
    appState.listeningCountdownQuestionId = 1;
  `, context);

  vm.runInContext("stopListeningPlayback({ preserveCountdown: true })", context);
  assert.equal(vm.runInContext("cancelListeningCountdownCalls", context), 0);
  assert.equal(vm.runInContext("listeningPlaybackQuestionId", context), 1);
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "answer");
  assert.equal(vm.runInContext("appState.listeningCountdownQuestionId", context), 1);

  vm.runInContext("stopListeningPlayback()", context);
  assert.equal(vm.runInContext("cancelListeningCountdownCalls", context), 1);
  assert.equal(vm.runInContext("listeningPlaybackQuestionId", context), null);
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "idle");
});

test("developer location jump plays the selected question directly and stops there", async () => {
  const { context, audioInstances } = createPersistentAudioContext({ introducedSections: {} });

  vm.runInContext('moveToDeveloperLocation("listening:2")', context);
  await Promise.resolve();

  assert.equal(audioInstances.length, 1);
  const persistentAudio = audioInstances[0];
  assert.match(persistentAudio.src, /\/q16\.wav$/, "Part 2 direct jump must skip the Part 2 instruction");
  assert.equal(vm.runInContext("appState.listeningIndex", context), 2);
  assert.equal(vm.runInContext("Boolean(appState.listeningPlayedQuestionIds['16'])", context), false, "developer preview must not mark the question as played");

  persistentAudio.finish();

  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "review-answer");
  assert.equal(vm.runInContext("appState.listeningCountdownQuestionId", context), null);
  assert.equal(vm.runInContext("appState.listeningIndex", context), 2, "preview must not advance to the next item");
});

test("developer jump invalidates stale audio callbacks when switching questions", async () => {
  const { context, audioInstances } = createPersistentAudioContext({ introducedSections: {} });

  vm.runInContext('moveToDeveloperLocation("listening:0")', context);
  await Promise.resolve();
  const persistentAudio = audioInstances[0];
  assert.match(persistentAudio.src, /\/q1\.wav$/);
  const staleEnd = persistentAudio.onended;

  vm.runInContext('moveToDeveloperLocation("listening:1")', context);
  await Promise.resolve();
  assert.match(persistentAudio.src, /\/q2\.wav$/);
  assert.equal(vm.runInContext("appState.listeningIndex", context), 1);

  staleEnd?.();
  assert.match(persistentAudio.src, /\/q2\.wav$/);
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "audio");

  persistentAudio.finish();
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "review-answer");
  assert.equal(vm.runInContext("appState.listeningCountdownQuestionId", context), null);
});

test("developer replay always forces the current question without an instruction or countdown", async () => {
  const { context, audioInstances } = createPersistentAudioContext({ introducedSections: {} });

  vm.runInContext(`
    appState.listeningIndex = 0;
    appState.listeningPlayedQuestionIds["1"] = true;
    listeningPlaybackQuestionId = 1;
    listeningPlaybackPhase = "review-answer";
  `, context);

  await vm.runInContext("replayListeningAudioForDeveloper()", context);
  const persistentAudio = audioInstances[0];

  assert.match(persistentAudio.src, /\/q1\.wav$/);
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "audio");

  persistentAudio.finish();
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "review-answer");
  assert.equal(vm.runInContext("appState.listeningCountdownQuestionId", context), null);
});
