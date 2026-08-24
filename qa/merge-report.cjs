const fs = require('node:fs');
const path = require('node:path');
const { expectedDeviceNames } = require('./device-matrix.cjs');

const outputRoot = path.resolve(process.cwd(), 'qa-output');
const partRoot = path.join(outputRoot, 'report-parts');

function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return null; }
}

function readParts() {
  if (!fs.existsSync(partRoot)) return [];
  return fs.readdirSync(partRoot)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(path.join(partRoot, name)))
    .filter(Boolean);
}

fs.mkdirSync(outputRoot, { recursive: true });

const deployment = readJson(path.join(outputRoot, 'deployment.json'));
const devices = readParts();
const browserOutcome = process.env.QA_BROWSER_STEP_OUTCOME || 'unknown';
const failedDevices = devices.filter((device) => device.testPassed !== true);
const completedDeviceNames = new Set(devices.map((device) => device.device));
const missingDevices = expectedDeviceNames.filter((name) => !completedDeviceNames.has(name));
const unexpectedDevices = devices.map((device) => device.device).filter((name) => !expectedDeviceNames.includes(name));
const overflowStates = devices.flatMap((device) =>
  (device.states || []).filter((state) => state.metrics?.horizontalOverflow).map((state) => ({ device: device.device, state: state.name })),
);
const consoleErrors = devices.flatMap((device) =>
  (device.actionableConsoleErrors || []).map((error) => ({ device: device.device, ...error })),
);
const pageErrors = devices.flatMap((device) =>
  (device.pageErrors || []).map((error) => ({ device: device.device, ...error })),
);
const requestFailures = devices.flatMap((device) =>
  (device.actionableRequestFailures || []).map((failure) => ({ device: device.device, ...failure })),
);
const httpErrors = devices.flatMap((device) =>
  (device.httpErrors || []).map((error) => ({ device: device.device, ...error })),
);

const passed =
  deployment?.status === 'ready' &&
  browserOutcome === 'success' &&
  missingDevices.length === 0 &&
  unexpectedDevices.length === 0 &&
  failedDevices.length === 0 &&
  overflowStates.length === 0 &&
  consoleErrors.length === 0 &&
  pageErrors.length === 0 &&
  httpErrors.length === 0;

const report = {
  generatedAt: new Date().toISOString(),
  repository: process.env.QA_REPOSITORY || deployment?.repository || '',
  commitSha: process.env.QA_EXPECTED_SHA || deployment?.commitSha || '',
  workflowRunId: process.env.QA_RUN_ID || deployment?.workflowRunId || '',
  workflowRunAttempt: process.env.QA_RUN_ATTEMPT || deployment?.workflowRunAttempt || '',
  target: process.env.QA_TARGET || deployment?.target || '',
  baseUrl: process.env.QA_BASE_URL || deployment?.baseUrl || '',
  deployment,
  browserStepOutcome: browserOutcome,
  status: passed ? 'passed' : 'failed',
  summary: {
    expectedDeviceCount: expectedDeviceNames.length,
    completedDeviceCount: devices.length,
    failedDeviceCount: failedDevices.length,
    missingDeviceCount: missingDevices.length,
    unexpectedDeviceCount: unexpectedDevices.length,
    horizontalOverflowCount: overflowStates.length,
    consoleErrorCount: consoleErrors.length,
    pageErrorCount: pageErrors.length,
    httpErrorCount: httpErrors.length,
    requestFailureCount: requestFailures.length,
  },
  findings: {
    missingDevices,
    unexpectedDevices,
    horizontalOverflow: overflowStates,
    consoleErrors,
    pageErrors,
    httpErrors,
    requestFailures,
  },
  devices,
  limitations: [
    'Tablet and iPhone projects are Playwright browser/device emulations; final microphone, rotation, hardware keyboard, and audio checks still require physical-device smoke tests.',
    'Service workers are blocked during regular browser QA; a separate production smoke test checks the deployed site after the production workflow succeeds.',
    'The regular browser flow verifies the speaking preflight UI but does not validate real microphone audio quality.',
    'Network request failures are recorded as diagnostics but are not by themselves a pass/fail condition because media cancellation during deliberate navigation can be expected.',
    'Normal successful QA does not save screenshots. Playwright screenshots/traces and named failure evidence are retained only when a test fails.',
  ],
};

fs.writeFileSync(path.join(outputRoot, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputRoot, 'latest.json'), `${JSON.stringify({
  generatedAt: report.generatedAt,
  status: report.status,
  repository: report.repository,
  commitSha: report.commitSha,
  target: report.target,
  baseUrl: report.baseUrl,
  report: 'report.json',
  devices: devices.map((device) => ({ device: device.device, testPassed: device.testPassed })),
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify(report.summary, null, 2));
console.log(`CBT browser QA combined status: ${report.status}`);
