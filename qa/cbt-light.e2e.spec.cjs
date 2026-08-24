const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-output');
const partRoot = path.join(outputRoot, 'report-parts');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

const writingSample =
  'Many students use online tools to study English because they can practice at any time and quickly review difficult points. However, students still need to think carefully and should not depend on automatic answers for everything.';

function makeSilentWav({ seconds = 3, sampleRate = 16000 } = {}) {
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const sampleCount = Math.max(1, Math.round(seconds * sampleRate));
  const dataSize = sampleCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

function ensureDirectories() {
  fs.mkdirSync(partRoot, { recursive: true });
  fs.mkdirSync(screenshotRoot, { recursive: true });
}

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function relativeToOutput(filePath) {
  return path.relative(outputRoot, filePath).split(path.sep).join('/');
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, filePath);
}

async function settle(page, milliseconds = 250) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(milliseconds);
}

async function readMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const overflowingElements = [];

    for (const element of document.querySelectorAll('body *')) {
      if (overflowingElements.length >= 25) break;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      if (rect.right > viewportWidth + 1 || rect.left < -1) {
        overflowingElements.push({
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className.slice(0, 180) : '',
          text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 160),
          rect: {
            left: Math.round(rect.left * 10) / 10,
            right: Math.round(rect.right * 10) / 10,
            top: Math.round(rect.top * 10) / 10,
            bottom: Math.round(rect.bottom * 10) / 10,
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
          },
        });
      }
    }

    return {
      viewportWidth,
      viewportHeight,
      deviceScaleFactor: window.devicePixelRatio,
      document: {
        scrollWidth: root.scrollWidth,
        scrollHeight: root.scrollHeight,
        clientWidth: root.clientWidth,
        clientHeight: root.clientHeight,
        bodyScrollWidth: body?.scrollWidth || 0,
        bodyScrollHeight: body?.scrollHeight || 0,
      },
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      overflowingElements,
    };
  });
}

function makeExamUrl(query) {
  const suffix = query ? `&${query}` : '';
  return `${baseUrl}/exam.html?plan=three&fresh=1&qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}${suffix}`;
}

function actionableConsoleErrors(items) {
  return items.filter((item) => !/ERR_ABORTED/i.test(item.text));
}

function actionableRequestFailures(items) {
  return items.filter((item) => !/ERR_ABORTED|NS_BINDING_ABORTED|cancelled|canceled|interrupted/i.test(item.errorText || ''));
}

async function addState(page, report, name) {
  report.states.push({
    name,
    capturedAt: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    metrics: await readMetrics(page),
    screenshotFiles: [],
  });
}

async function captureFailure(page, report) {
  const filePath = path.join(screenshotRoot, `${safeName(report.device)}-failure-evidence.jpg`);
  await page.screenshot({
    path: filePath,
    type: 'jpeg',
    quality: 60,
    fullPage: false,
    scale: 'css',
    animations: 'disabled',
  });
  report.screenshotFiles.push(relativeToOutput(filePath));
}

ensureDirectories();

test('CBT lightweight critical browser QA', async ({ page }, testInfo) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  const report = {
    generatedAt: new Date().toISOString(),
    repository: process.env.QA_REPOSITORY || '',
    commitSha: process.env.QA_EXPECTED_SHA || '',
    workflowRunId: process.env.QA_RUN_ID || '',
    target: process.env.QA_TARGET || '',
    baseUrl,
    device: testInfo.project.name,
    browserName: testInfo.project.use.browserName || '',
    configuredViewport: testInfo.project.use.viewport || null,
    configuredDeviceScaleFactor: testInfo.project.use.deviceScaleFactor || 1,
    actions: [],
    states: [],
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    httpErrors: [],
    stubbedAudioRequests: [],
    screenshotFiles: [],
    testPassed: false,
    failure: null,
  };

  if (process.env.QA_TARGET === 'github-actions-local') {
    const silentWav = makeSilentWav();
    await page.route('**/audio-r2/**', async (route) => {
      report.stubbedAudioRequests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav, headers: { 'Cache-Control': 'no-store' } });
    });
  }

  page.on('console', (message) => {
    if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() });
  });
  page.on('pageerror', (error) => report.pageErrors.push({ name: error.name, message: error.message, stack: error.stack || '' }));
  page.on('requestfailed', (request) => report.requestFailures.push({
    url: request.url(), method: request.method(), resourceType: request.resourceType(), errorText: request.failure()?.errorText || '',
  }));
  page.on('response', (response) => {
    if (response.status() < 400) return;
    report.httpErrors.push({ status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
  });

  const action = (value) => report.actions.push({ at: new Date().toISOString(), action: value });

  try {
    action('Open normal paid CBT start screen.');
    await page.goto(makeExamUrl('mode=normal'), { waitUntil: 'domcontentloaded' });
    await settle(page, 350);
    await expect(page.locator('#app')).toBeVisible();
    const startButton = page.locator('button[data-action="start"]').first();
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await addState(page, report, 'normal-start');

    action('Use the real start button to enter Speaking preflight.');
    await startButton.click();
    await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
    await addState(page, report, 'normal-speaking-preflight');

    action('Open developer navigation only for deep-state rendering checks.');
    await page.goto(makeExamUrl('dev=1'), { waitUntil: 'domcontentloaded' });
    await settle(page, 250);
    const toolbar = page.locator('.developer-toolbar');
    await expect(toolbar).toBeVisible();

    action('Render Reading and verify progress-review entry.');
    await toolbar.getByRole('button', { name: 'リーディング', exact: true }).click();
    await expect(page.locator('.reading-frame')).toBeVisible();
    await expect(page.locator('[data-progress-review-open="reading"]')).toBeVisible();
    await addState(page, report, 'dev-reading-first');

    action('Render Writing and type a realistic answer.');
    await toolbar.getByRole('button', { name: 'ライティング', exact: true }).click();
    const writingBox = page.locator('textarea.writing-textarea').first();
    await expect(writingBox).toBeVisible();
    await writingBox.fill(writingSample);
    await expect(writingBox).toHaveValue(writingSample);
    await addState(page, report, 'dev-writing-typed');

    action('Render Listening and verify progress-review entry.');
    await toolbar.getByRole('button', { name: 'リスニング', exact: true }).click();
    await expect(page.locator('.listen-frame')).toBeVisible();
    await expect(page.locator('[data-listening-audio-status]')).toBeVisible();
    await expect(page.locator('[data-progress-review-open="listening"]')).toBeVisible();
    await settle(page, 450);
    await addState(page, report, 'dev-listening-first');

    action('Render result screen.');
    await toolbar.getByRole('button', { name: '採点・解説', exact: true }).click();
    await expect(page.locator('.result-screen')).toBeVisible();
    await addState(page, report, 'dev-result');

    const overflowStates = report.states.filter((state) => state.metrics.horizontalOverflow).map((state) => state.name);
    const consoleErrors = actionableConsoleErrors(report.consoleErrors);
    const requestFailures = actionableRequestFailures(report.requestFailures);

    expect(report.pageErrors, `Page errors: ${JSON.stringify(report.pageErrors)}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
    expect(report.httpErrors, `HTTP 4xx/5xx responses: ${JSON.stringify(report.httpErrors)}`).toEqual([]);
    expect(overflowStates, `Horizontal overflow detected in: ${overflowStates.join(', ')}`).toEqual([]);
    report.actionableRequestFailures = requestFailures;
    report.testPassed = true;
  } catch (error) {
    report.failure = { name: error?.name || 'Error', message: error?.message || String(error), stack: error?.stack || '' };
    try { await captureFailure(page, report); } catch (captureError) { report.failureEvidenceError = String(captureError?.message || captureError); }
    throw error;
  } finally {
    report.completedAt = new Date().toISOString();
    report.currentUrl = page.url();
    report.pageTitle = await page.title().catch(() => '');
    report.actionableConsoleErrors = actionableConsoleErrors(report.consoleErrors);
    report.actionableRequestFailures = report.actionableRequestFailures || actionableRequestFailures(report.requestFailures);
    const partPath = path.join(partRoot, `${safeName(testInfo.project.name)}.json`);
    writeJsonAtomic(partPath, report);
  }
});
