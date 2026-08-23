import fs from 'node:fs';

const file = 'qa/normal-production.e2e.spec.cjs';
let source = fs.readFileSync(file, 'utf8');
const before = 'cancelListeningPlayback(); cancelListeningAnswerCountdown();';
const after = 'cancelListeningAnswerCountdown();';
if (!source.includes(before)) {
  throw new Error('Expected QA helper call was not found.');
}
source = source.replace(before, after);
fs.writeFileSync(file, source);
console.log('Patched normal production QA helper call.');
