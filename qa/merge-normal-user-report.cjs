const fs = require('node:fs');
const path = require('node:path');

const outputRoot = path.resolve(process.cwd(), 'qa-normal-output');
const partRoot = path.join(outputRoot, 'report-parts');
const reportPath = path.join(outputRoot, 'report.json');
const latestPath = path.join(outputRoot, 'latest.json');

const parts = fs.existsSync(partRoot)
  ? fs.readdirSync(partRoot).filter((name) => name.endsWith('.json')).sort().map((name) => JSON.parse(fs.readFileSync(path.join(partRoot, name), 'utf8')))
  : [];

const findings = parts.flatMap((part) => (part.findings || []).map((finding) => ({ device: part.device, setKey: part.setKey, ...finding })));
const severityCounts = findings.reduce((acc, finding) => {
  acc[finding.severity] = (acc[finding.severity] || 0) + 1;
  return acc;
}, {});
const failedParts = parts.filter((part) => !part.testPassed);
const pageErrors = parts.flatMap((part) => part.pageErrors || []);
const consoleErrors = parts.flatMap((part) => part.actionableConsoleErrors || []);
const requestFailures = parts.flatMap((part) => part.actionableRequestFailures || []);

const report = {
  generatedAt: new Date().toISOString(),
  repository: process.env.QA_REPOSITORY || '',
  commitSha: process.env.QA_EXPECTED_SHA || '',
  workflowRunId: process.env.QA_RUN_ID || '',
  target: process.env.QA_TARGET || '',
  baseUrl: process.env.QA_BASE_URL || '',
  status: failedParts.length ? 'failed' : findings.some((item) => item.severity === 'high') ? 'passed-with-high-findings' : findings.length ? 'passed-with-findings' : 'passed',
  passed: failedParts.length === 0 && parts.length > 0,
  partCount: parts.length,
  expectedPartCount: 6,
  severityCounts,
  findings,
  failedParts: failedParts.map((part) => ({ device: part.device, setKey: part.setKey, failure: part.failure })),
  pageErrors,
  consoleErrors,
  requestFailures,
  audioProbes: parts.flatMap((part) => (part.audioProbes || []).map((probe) => ({ device: part.device, setKey: part.setKey, ...probe }))),
  parts: parts.map((part) => ({
    device: part.device,
    setKey: part.setKey,
    testPassed: part.testPassed,
    stateNames: (part.states || []).map((state) => state.name),
    readingQuestionCount: (part.readingQuestionIds || []).length,
    listeningQuestionCount: (part.listeningQuestionIds || []).length,
    speakingStages: part.speakingStages || [],
    screenshotFiles: part.screenshotFiles || [],
  })),
};

fs.mkdirSync(outputRoot, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.writeFileSync(latestPath, `${JSON.stringify({ generatedAt: report.generatedAt, commitSha: report.commitSha, target: report.target, status: report.status, report: 'report.json' }, null, 2)}\n`, 'utf8');

if (parts.length !== report.expectedPartCount) {
  console.warn(`Expected ${report.expectedPartCount} report parts, found ${parts.length}; preserving partial evidence.`);
}
