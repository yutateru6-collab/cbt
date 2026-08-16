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

test("Grade 2 exam ships and precaches the persistent listening audio layer", () => {
  assert.match(examSource, /grade2-listening-persistent-audio\.js\?v=grade2-ios-listening-v1/);
  assert.ok(prepareSource.includes('"grade2-listening-persistent-audio.js"'));
  assert.ok(swSource.includes('"/grade2-listening-persistent-audio.js"'));
  assert.ok(examSwSource.includes('"/grade2-listening-persistent-audio.js"'));
});

test("listening reuses one Audio element when advancing between questions", async () => {
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
      this.onended?.();
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
    const GRADE2_LISTENING_INSTRUCTION_AUDIO = { part1: "intro.wav", part2: "intro2.wav" };
    const listeningQuestions = [
      { id: 1, audioFile: "q1.wav" },
      { id: 2, audioFile: "q2.wav" },
    ];
    const appState = {
      listeningIndex: 0,
      listeningIntroducedSections: { part1: true },
      listeningPlayedQuestionIds: {},
      listeningReviewMode: false,
      listeningAnswerRemaining: 10,
      speakingOutputVolume: 70,
    };
    let listeningAudioElement = null;
    let listeningInstructionAudioElement = null;
    let listeningSpeechUtterance = null;
    let listeningPlaybackQuestionId = 1;
    let listeningPlaybackPhase = "audio";
    let listeningAnswerDeadline = 0;
    let listeningPlaybackStarts = 0;
    function getListeningAudioVolume() { return 0.7; }
    function getGrade2ListeningSectionKey() { return "part1"; }
    function needsGrade2ListeningInstruction() { return false; }
    function hasPlayedListeningQuestion(id) { return Boolean(appState.listeningPlayedQuestionIds[id]); }
    function markListeningQuestionPlayed(id) { appState.listeningPlayedQuestionIds[id] = true; }
    function updateListeningPlaybackUi() {}
    function saveState() {}
    function startListeningAnswerCountdown() {
      listeningPlaybackPhase = "answer";
      appState.listeningAnswerRemaining = 10;
    }
    async function playGrade2ListeningInstruction() { return false; }
    async function playListeningAudio() {}
    function mountListeningAudio() {}
    function stopListeningPlayback() {}
  `, context);

  vm.runInContext(patchSource, context);
  await vm.runInContext("playListeningAudio()", context);

  assert.equal(audioInstances.length, 1);
  const persistentAudio = audioInstances[0];
  assert.match(persistentAudio.src, /\/q1\.wav$/);

  persistentAudio.finish();
  assert.equal(vm.runInContext("listeningPlaybackPhase", context), "answer");

  vm.runInContext(`
    appState.listeningIndex = 1;
    stopListeningPlayback();
    listeningPlaybackQuestionId = 2;
    listeningPlaybackPhase = "audio";
  `, context);
  await vm.runInContext("playListeningAudio()", context);

  assert.equal(audioInstances.length, 1, "a second Audio element must not be created for No.2");
  assert.match(persistentAudio.src, /\/q2\.wav$/);
});
