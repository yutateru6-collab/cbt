const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-output');
const partRoot = path.join(outputRoot, 'report-parts');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

const writingSample =
  'Many students use online tools to study English because they can practice at any time and quickly review difficult points. These tools are useful for repeated practice and can make study more convenient. However, students still need to think carefully about what they read and should not depend on automatic answers for everything.';

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

async function settle(page, milliseconds = 500) {
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
      const style = window.getComputedStyle(element);
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

async function captureState(page, report, stateName, options = {}) {
  const project = safeName(report.device);
  const state = safeName(stateName);
  const prefix = `${project}-${state}`;
  const viewportPng = path.join(screenshotRoot, `${prefix}-viewport.png`);
  const previewJpeg = path.join(screenshotRoot, `${prefix}-ai-preview.jpg`);
  const files = [];

  await page.screenshot({
    path: viewportPng,
    type: 'png',
    fullPage: false,
    scale: 'device',
    animations: 'disabled',
  });
  files.push(relativeToOutput(viewportPng));

  await page.screenshot({
    path: previewJpeg,
    type: 'jpeg',
    quality: 55,
    fullPage: false,
    scale: 'css',
    animations: 'disabled',
  });
  files.push(relativeToOutput(previewJpeg));

  if (options.fullPage) {
    const fullPageSafe = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const cssHeight = Math.max(root.scrollHeight, body?.scrollHeight || 0);
      const cssWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);
      const scale = window.devicePixelRatio || 1;
      return cssHeight * scale <= 32000 && cssWidth * scale <= 32000;
    });
    if (fullPageSafe) {
      const fullPng = path.join(screenshotRoot, `${prefix}-full.png`);
      await page.screenshot({
        path: fullPng,
        type: 'png',
        fullPage: true,
        scale: 'device',
        animations: 'disabled',
      });
      files.push(relativeToOutput(fullPng));
    }
  }

  if (options.detailLocator) {
    const locator = options.detailLocator;
    if (await locator.isVisible().catch(() => false)) {
      const box = await locator.boundingBox();
      const viewport = page.viewportSize();
      if (box && viewport) {
        const left = Math.max(0, box.x);
        const top = Math.max(0, box.y);
        const right = Math.min(viewport.width, box.x + box.width);
        const bottom = Math.min(viewport.height, box.y + box.height);
        if (right - left > 2 && bottom - top > 2) {
          const detailJpeg = path.join(screenshotRoot, `${prefix}-detail-crop.jpg`);
          await page.screenshot({
            path: detailJpeg,
            type: 'jpeg',
            quality: 65,
            scale: 'device',
            animations: 'disabled',
            clip: {
              x: left,
              y: top,
              width: right - left,
              height: bottom - top,
            },
          });
          files.push(relativeToOutput(detailJpeg));
        }
      }
    }
  }

  const metrics = await readMetrics(page);
  const snapshot = {
    name: stateName,
    capturedAt: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    metrics,
    screenshotFiles: files,
  };
  report.states.push(snapshot);
  report.screenshotFiles.push(...files);
  return snapshot;
}

function actionableConsoleErrors(consoleErrors) {
  return consoleErrors.filter((item) => !/ERR_ABORTED/i.test(item.text));
}

function actionableRequestFailures(requestFailures) {
  return requestFailures.filter((item) => !/ERR_ABORTED|NS_BINDING_ABORTED|cancelled|canceled|interrupted/i.test(item.errorText || ''));
}

function makeExamUrl(query) {
  const suffix = query ? `&${query}` : '';
  return `${baseUrl}/exam.html?plan=three&fresh=1&qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}${suffix}`;
}

ensureDirectories();

test('CBT critical browser flow and visual evidence', async ({ page }, testInfo) => {
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
    stubbedAudioRequests: [],
    screenshotFiles: [],
    testPassed: false,
    failure: null,
  };

  if (process.env.QA_TARGET === 'github-actions-local') {
    const silentWav = makeSilentWav();
    await page.route('**/audio-r2/**', async (route) => {
      report.stubbedAudioRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'audio/wav',
        headers: { 'Cache-Control': 'no-store' },
        body: silentWav,
      });
    });
  }

  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    report.consoleErrors.push({
      text: message.text(),
      location: message.location(),
    });
  });

  page.on('pageerror', (error) => {
    report.pageErrors.push({
      name: error.name,
      message: error.message,
      stack: error.stack || '',
    });
  });

  page.on('requestfailed', (request) => {
    report.requestFailures.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType(),
      errorText: request.failure()?.errorText || '',
    });
  });

  const recordAction = (action) => {
    report.actions.push({ at: new Date().toISOString(), action });
  };

  try {
    recordAction('Open the normal paid CBT start screen.');
    await page.goto(makeExamUrl('mode=normal'), { waitUntil: 'domcontentloaded' });
    await settle(page, 700);
    await expect(page.locator('#app')).toBeVisible();
    const startButton = page.locator('button[data-action="start"]').first();
    await expect(startButton).toBeVisible();
    await expect(startButton).toBeEnabled();
    await captureState(page, report, 'normal-start', {
      fullPage: true,
      detailLocator: page.locator('#app'),
    });

    recordAction('Click the real start button and enter the speaking preflight flow.');
    await startButton.click();
    await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
    await settle(page, 400);
    await captureState(page, report, 'normal-speaking-preflight', {
      detailLocator: page.locator('.grade2-speaking-flow'),
    });

    recordAction('Open the existing developer mode for deep-state QA navigation.');
    await page.goto(makeExamUrl('dev=1'), { waitUntil: 'domcontentloaded' });
    await settle(page, 600);
    const toolbar = page.locator('.developer-toolbar');
    await expect(toolbar).toBeVisible();

    recordAction('Navigate to the first Reading screen using the existing developer toolbar.');
    await toolbar.getByRole('button', { name: 'リーディング', exact: true }).click();
    await expect(page.locator('.reading-frame')).toBeVisible();
    await settle(page, 350);
    await captureState(page, report, 'dev-reading-first', {
      detailLocator: page.locator('.reading-frame'),
    });

    recordAction('Navigate to Writing and type a realistic English response key by key.');
    await toolbar.getByRole('button', { name: 'ライティング', exact: true }).click();
    const writingBox = page.locator('textarea.writing-textarea').first();
    await expect(writingBox).toBeVisible();
    await writingBox.click();
    await writingBox.pressSequentially(writingSample, { delay: 1 });
    await expect(writingBox).toHaveValue(writingSample);
    await settle(page, 250);
    await captureState(page, report, 'dev-writing-typed', {
      detailLocator: writingBox,
    });

    recordAction('Navigate to Listening and verify its active question UI is rendered.');
    await toolbar.getByRole('button', { name: 'リスニング', exact: true }).click();
    await expect(page.locator('.listen-frame')).toBeVisible();
    await expect(page.locator('[data-listening-audio-status]')).toBeVisible();
    await settle(page, 700);
    await captureState(page, report, 'dev-listening-first', {
      detailLocator: page.locator('.listen-frame'),
    });

    recordAction('Navigate to the score/explanation result screen.');
    await toolbar.getByRole('button', { name: '採点・解説', exact: true }).click();
    await expect(page.locator('.result-screen')).toBeVisible();
    await settle(page, 350);
    await captureState(page, report, 'dev-result', {
      fullPage: true,
      detailLocator: page.locator('.result-screen'),
    });

    const overflowStates = report.states
      .filter((state) => state.metrics.horizontalOverflow)
      .map((state) => state.name);
    const consoleErrors = actionableConsoleErrors(report.consoleErrors);

    expect(report.pageErrors, `Page errors: ${JSON.stringify(report.pageErrors)}`).toEqual([]);
    expect(consoleErrors, `Console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
    expect(overflowStates, `Horizontal overflow detected in: ${overflowStates.join(', ')}`).toEqual([]);

    report.testPassed = true;
  } catch (error) {
    report.failure = {
      name: error?.name || 'Error',
      message: error?.message || String(error),
      stack: error?.stack || '',
    };
    try {
      await captureState(page, report, 'failure-evidence', {
        detailLocator: page.locator('#app'),
      });
    } catch (captureError) {
      report.failureEvidenceError = String(captureError?.message || captureError);
    }
    throw error;
  } finally {
    report.completedAt = new Date().toISOString();
    report.currentUrl = page.url();
    report.pageTitle = await page.title().catch(() => '');
    report.actionableConsoleErrors = actionableConsoleErrors(report.consoleErrors);
    report.actionableRequestFailures = actionableRequestFailures(report.requestFailures);
    const partPath = path.join(partRoot, `${safeName(testInfo.project.name)}.json`);
    writeJsonAtomic(partPath, report);
  }
});
