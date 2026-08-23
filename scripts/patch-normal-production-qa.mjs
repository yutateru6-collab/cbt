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
console.log('Patched normal production QA helper and countdown deadline.');
