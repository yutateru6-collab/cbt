import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const branch = process.env.GITHUB_REF_NAME || '';
const shouldRun = process.env.GITHUB_ACTIONS === 'true'
  && process.env.GITHUB_WORKFLOW === 'CBT browser QA'
  && branch === 'agent/apply-grade2-reading-fixes-20260823';

if (!shouldRun) {
  console.log('Grade 2 reading bootstrap: no-op outside the dedicated CBT browser QA branch.');
  process.exit(0);
}

const targetPath = 'grade2-vocab-sets.js';
let text = fs.readFileSync(targetPath, 'utf8');

const replacements = [
  [
`            "text": "A: I don’t think my parents will let me study abroad next summer.\\nB: Maybe the teacher can (　　　) them by explaining the program’s safety rules.",
            "choices": [
              "persuade",
              "warn",
              "remind",
              "inform"
            ],
            "correct": 1,
            "explanation": "1 persuade\\n両親が留学を許してくれなさそうなので、先生が安全ルールを説明して考えを変えてもらう場面です。persuade 人で「人を説得する」です。\\nwarn は「警告する」、remind は「思い出させる」、inform は「知らせる」です。"`,
`            "text": "A: I don’t think my parents will let me study abroad next summer.\\nB: Maybe the teacher can (　　　) them to let you go by explaining the program’s safety rules.",
            "choices": [
              "persuade",
              "warn",
              "remind",
              "inform"
            ],
            "correct": 1,
            "explanation": "1 persuade\\n両親が留学を許してくれなさそうなので、先生が安全ルールを説明し、許可するよう説得する場面です。persuade 人 to do で「人を説得して～してもらう」という意味です。\\nwarn は「警告する」、remind は「思い出させる」、inform は「知らせる」で、この文脈の「許可するよう説得する」には合いません。"`
  ],
  [
`            "text": "A: Does that clinic still accept patients on Sundays?\\nB: No. Since April, it is (　　　) open on weekends because two doctors moved away."`,
`            "text": "A: Does that clinic still accept patients on Sundays?\\nB: No. It is (　　　) open on weekends because two doctors moved away in April."`
  ],
  [
`            "choices": [
              "at walking distance",
              "in walking distance",
              "to walking distance",
              "within walking distance"
            ],
            "correct": 4,
            "explanation": "4 within walking distance\\n駅から歩ける距離にあったので、旅行者たちはタクシーを使わず歩いたという文脈です。within walking distance of ～ は「～から歩いて行ける距離に」という固定表現です。\\n他の選択肢は、walking distance of the station と自然につながる表現ではありません。"`,
`            "choices": [
              "at walking distance",
              "beyond walking distance",
              "to walking distance",
              "within walking distance"
            ],
            "correct": 4,
            "explanation": "4 within walking distance\\n駅から歩ける距離にあったので、旅行者たちはタクシーを使わず歩いたという文脈です。within walking distance of ～ は「～から歩いて行ける距離に」という固定表現です。\\nbeyond walking distance は「歩いて行ける距離を超えて」という反対の意味です。at walking distance と to walking distance は、この文では自然につながりません。"`
  ],
  [
`          "Please reply by Thursday afternoon to confirm that you are still coming. Also, let us know if you would like to borrow a small notepad during the tour, as writing directly on clipboards is not allowed near some objects. If we do not receive your reply, we may offer your reservation to a person on the waiting list.",`,
`          "Please reply by Thursday afternoon to confirm that you are still coming. Also, let us know if you would like to borrow a small notepad and pencil during the tour, as visitors may not bring their own writing materials near some objects. If we do not receive your reply, we may offer your reservation to a person on the waiting list.",`
  ],
  [
`            "text": "Several guests at the café had little ( ) after the late lunch, so they shared one slice of cake instead of ordering three.",
            "choices": [
              "appetite",
              "interest",
              "patience",
              "energy"
            ],
            "correct": 1,
            "explanation": "appetite は「食欲」。遅い昼食のあとであまり食欲がなかったため、ケーキを1切れだけ分けた、という流れです。\\ninterest は「興味」、patience は「忍耐」、energy は「体力・エネルギー」。"`,
`            "text": "Several guests at the café were still full after a late lunch, so they had little ( ) and shared one slice of cake instead of ordering three.",
            "choices": [
              "appetite",
              "confidence",
              "patience",
              "energy"
            ],
            "correct": 1,
            "explanation": "appetite は「食欲」。遅い昼食のあとでまだ満腹だったため、食欲がほとんどなく、ケーキを1切れだけ分けたという流れです。\\nconfidence は「自信」、patience は「忍耐」、energy は「体力・エネルギー」です。"`
  ]
];

for (let i = 0; i < replacements.length; i++) {
  const [oldBlock, newBlock] = replacements[i];
  const count = text.split(oldBlock).length - 1;
  if (count !== 1) throw new Error(`Fix ${i + 1}: expected exactly one old block, found ${count}`);
  text = text.replace(oldBlock, newBlock);
}

fs.writeFileSync(targetPath, text, 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(text, sandbox, { filename: targetPath });
const sets = sandbox.window.scbtGrade2VocabSets;
if (!Array.isArray(sets) || sets.length !== 5) throw new Error(`Expected 5 sets, got ${sets?.length}`);
for (const set of sets) {
  const questions = (set.readingPages || []).flatMap(page => page.questions || []);
  if (questions.length !== 31) throw new Error(`${set.key}: expected 31 reading questions, got ${questions.length}`);
  const ids = questions.map(q => q.id);
  if (new Set(ids).size !== ids.length) throw new Error(`${set.key}: duplicate reading IDs`);
  for (const q of questions) {
    if (Array.isArray(q.choices) && (!Number.isInteger(q.correct) || q.correct < 1 || q.correct > q.choices.length)) {
      throw new Error(`${set.key} q${q.id}: invalid correct answer ${q.correct}`);
    }
  }
}
const set1 = sets.find(s => s.key === 'set-01');
const set2 = sets.find(s => s.key === 'set-02');
const allQuestions = set => (set.readingPages || []).flatMap(page => page.questions || []);
const q1 = id => allQuestions(set1).find(q => q.id === id);
const q2 = id => allQuestions(set2).find(q => q.id === id);
if (!q1(9).text.includes('them to let you go')) throw new Error('Set 01 No.9 fix missing');
if (!q1(16).text.includes('moved away in April')) throw new Error('Set 01 No.16 fix missing');
if (!q1(17).choices.includes('beyond walking distance') || q1(17).choices.includes('in walking distance')) throw new Error('Set 01 No.17 fix missing');
const emailPage = set1.readingPages.find(p => p.label === 'メール 3A');
if (!emailPage?.passage.join('\n').includes('small notepad and pencil')) throw new Error('Set 01 email fix missing');
if (!q2(5).text.includes('were still full after a late lunch') || !q2(5).choices.includes('confidence')) throw new Error('Set 02 No.5 fix missing');

execFileSync(process.execPath, ['--check', targetPath], { stdio: 'inherit' });
execFileSync(process.execPath, ['--test', 'tests/grade2-scoring.test.cjs'], { stdio: 'inherit' });
execFileSync('git', ['diff', '--check'], { stdio: 'inherit' });

fs.writeFileSync('package.json', '{\n  "devDependencies": {\n    "wrangler": "4.114.0"\n  }\n}\n', 'utf8');
if (fs.existsSync('.github/workflows/apply-grade2-reading-fixes.yml')) fs.rmSync('.github/workflows/apply-grade2-reading-fixes.yml');
fs.rmSync('scripts/apply-grade2-reading-fixes.mjs');

execFileSync('git', ['config', 'user.name', 'github-actions[bot]']);
execFileSync('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
execFileSync('git', ['add', 'grade2-vocab-sets.js', 'package.json', 'scripts/apply-grade2-reading-fixes.mjs', '.github/workflows/apply-grade2-reading-fixes.yml']);
execFileSync('git', ['commit', '-m', 'Fix ambiguous Grade 2 reading items'], { stdio: 'inherit' });
execFileSync('git', ['push', 'origin', `HEAD:${branch}`], { stdio: 'inherit' });
console.log('Validated and committed the five Grade 2 reading fixes.');
