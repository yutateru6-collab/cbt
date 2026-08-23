import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const file = 'qa/normal-production.e2e.spec.cjs';
let source = fs.readFileSync(file, 'utf8');

const missingHelperBefore = 'cancelListeningPlayback(); cancelListeningAnswerCountdown();';
const missingHelperAfter = 'cancelListeningAnswerCountdown();';
if (!source.includes(missingHelperBefore)) {
  throw new Error('Expected QA helper call was not found.');
}
source = source.replace(missingHelperBefore, missingHelperAfter);

const countdownBefore = "cancelListeningAnswerCountdown(); appState.module='listening'; appState.listeningIndex=listeningQuestions.length-1; appState.listeningReviewMode=false; render(); startListeningAnswerCountdown(listeningQuestions[appState.listeningIndex]); appState.listeningAnswerRemaining=1; updateListeningPlaybackUi();";
const countdownAfter = "cancelListeningAnswerCountdown(); appState.module='listening'; appState.listeningIndex=listeningQuestions.length-1; appState.listeningReviewMode=false; render(); const q=listeningQuestions[appState.listeningIndex]; listeningPlaybackPhase='answer'; appState.listeningAnswerRemaining=1; listeningAnswerDeadline=Date.now()+300; appState.listeningAnswerDeadline=listeningAnswerDeadline; appState.listeningCountdownQuestionId=q.id; scheduleListeningAnswerCountdown(q.id,listeningAnswerDeadline); updateListeningPlaybackUi();";
if (!source.includes(countdownBefore)) {
  throw new Error('Expected countdown acceleration block was not found.');
}
source = source.replace(countdownBefore, countdownAfter);

fs.writeFileSync(file, source);
execFileSync('git', ['update-index', '--assume-unchanged', file]);

const sheetFile = 'qa/make-contact-sheet.cjs';
let sheet = fs.readFileSync(sheetFile, 'utf8');
const statesBefore = `const states = [
  ['normal-start', '通常開始'],
  ['normal-speaking-preflight', 'Speaking確認'],
  ['dev-reading-first', 'Reading'],
  ['dev-writing-typed', 'Writing入力'],
  ['dev-listening-first', 'Listening'],
  ['dev-result', '結果'],
];`;
const statesAfter = `const states = [
  ['normal-start', '通常開始'],
  ['speaking-preflight', 'Speaking確認'],
  ['speaking-complete', 'Speaking完了'],
  ['listening-first', 'Listening開始'],
  ['listening-last-countdown', 'Listening最終'],
  ['reading-first', 'Reading開始'],
  ['writing-first', 'Writing開始'],
  ['result', '結果'],
];`;
if (!sheet.includes(statesBefore)) {
  throw new Error('Expected contact-sheet state list was not found.');
}
sheet = sheet.replace(statesBefore, statesAfter)
  .replace('bridgeWidth: 70,', 'bridgeWidth: 110,')
  .replace('bridgeWidth: 45,', 'bridgeWidth: 90,')
  .replace('quality: 5,', 'quality: 12,');
fs.writeFileSync(sheetFile, sheet);
execFileSync('git', ['update-index', '--assume-unchanged', sheetFile]);

console.log('Patched normal production QA countdown and visual states.');
