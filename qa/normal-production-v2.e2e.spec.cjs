const fs = require('node:fs');
const path = require('node:path');

const sourceFile = path.join(__dirname, 'normal-production.e2e.spec.cjs');
let source = fs.readFileSync(sourceFile, 'utf8');

const before = `    cancelListeningAnswerCountdown();
    appState.module='listening';
    appState.listeningIndex=listeningQuestions.length-1;
    appState.listeningReviewMode=false;
    render();
    const q=listeningQuestions[appState.listeningIndex];
    listeningPlaybackPhase='answer';
    appState.listeningAnswerRemaining=1;
    listeningAnswerDeadline=Date.now()+300;
    appState.listeningAnswerDeadline=listeningAnswerDeadline;
    appState.listeningCountdownQuestionId=q.id;
    scheduleListeningAnswerCountdown(q.id,listeningAnswerDeadline);
    updateListeningPlaybackUi();`;

const after = `    cancelListeningAnswerCountdown();
    appState.module='listening';
    appState.listeningIndex=listeningQuestions.length-1;
    appState.listeningReviewMode=false;
    const q=listeningQuestions[appState.listeningIndex];
    listeningAnswerDeadline=Date.now()+500;
    appState.listeningAnswerRemaining=1;
    appState.listeningAnswerDeadline=listeningAnswerDeadline;
    appState.listeningCountdownQuestionId=q.id;
    listeningPlaybackQuestionId=null;
    listeningPlaybackPhase='idle';
    render();
    updateListeningPlaybackUi();`;

if (!source.includes(before)) {
  throw new Error('Expected listening acceleration block was not found in normal-production.e2e.spec.cjs');
}
source = source.replace(before, after);

const execute = new Function('require', '__filename', '__dirname', source);
execute(require, sourceFile, __dirname);
