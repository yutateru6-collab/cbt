const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-normal-output');
const partRoot = path.join(outputRoot, 'report-parts');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');
const qaTarget = process.env.QA_TARGET || 'local-normal';
const setKeys = ['set-01', 'set-02', 'set-03'];
const speakingAudioProbe = 'https://pub-6e10f4d8b90b42c79b09bec4ee876a01.r2.dev/scbt/grade2/releases/20260815-gemini-speaking-kore-v5/common/sound-check.wav';

const summaryAnswer = 'Many students use online tools to study English because they can practice at any time and quickly review difficult points. These tools make study convenient and support repeated practice. However, students still need to think carefully about what they read and should not depend on automatic answers for everything.';
const essayAnswer = 'I think schools should give students more chances to use digital tools in class. First, these tools can help students review difficult lessons at their own speed, so they can spend more time on weak points. Second, digital materials can provide videos, audio, and practice questions that make lessons easier to understand. However, teachers should set clear rules because students may become distracted or rely too much on automatic answers. Used carefully, digital tools can support both independent study and classroom learning.';

function safeName(value) {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, '-');
}

function relativeToOutput(filePath) {
  return path.relative(outputRoot, filePath).split(path.sep).join('/');
}

function writeJsonAtomic(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temp, filePath);
}

function makeSilentWav({ seconds = 0.08, sampleRate = 16000 } = {}) {
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

async function installBrowserTestDoubles(page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    const makeTrack = () => ({
      kind: 'audio',
      enabled: true,
      muted: false,
      readyState: 'live',
      stop() { this.readyState = 'ended'; },
      getSettings() { return { sampleRate: 48000, channelCount: 1 }; },
    });
    const makeStream = () => {
      const track = makeTrack();
      return {
        id: `qa-stream-${Math.random()}`,
        active: true,
        getTracks: () => [track],
        getAudioTracks: () => [track],
      };
    };

    const mediaDevices = {
      getUserMedia: async () => makeStream(),
      enumerateDevices: async () => [{ kind: 'audioinput', deviceId: 'qa-mic', label: 'QA microphone', groupId: 'qa' }],
    };
    try {
      Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: mediaDevices });
    } catch {
      navigator.mediaDevices = mediaDevices;
    }

    class QaMediaRecorder extends EventTarget {
      constructor(stream, options = {}) {
        super();
        this.stream = stream;
        this.mimeType = options.mimeType || 'audio/webm';
        this.state = 'inactive';
      }
      start() {
        this.state = 'recording';
        this.dispatchEvent(new Event('start'));
      }
      stop() {
        if (this.state === 'inactive') return;
        const dataEvent = new Event('dataavailable');
        Object.defineProperty(dataEvent, 'data', {
          configurable: true,
          value: new Blob([new Uint8Array(2048)], { type: this.mimeType }),
        });
        this.dispatchEvent(dataEvent);
        this.state = 'inactive';
        this.dispatchEvent(new Event('stop'));
      }
      pause() { this.state = 'paused'; }
      resume() { this.state = 'recording'; }
      requestData() {}
      static isTypeSupported() { return true; }
    }
    try {
      Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: QaMediaRecorder });
    } catch {
      window.MediaRecorder = QaMediaRecorder;
    }

    class QaAudioContext {
      constructor() { this.state = 'running'; }
      createAnalyser() {
        return {
          fftSize: 1024,
          smoothingTimeConstant: 0.78,
          connect() {},
          disconnect() {},
          getByteTimeDomainData(samples) {
            samples.fill(128);
            if (samples.length > 2) {
              samples[0] = 148;
              samples[1] = 108;
            }
          },
        };
      }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      resume() { this.state = 'running'; return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
    }
    window.AudioContext = QaAudioContext;
    window.webkitAudioContext = QaAudioContext;

    const nativePause = HTMLMediaElement.prototype.pause;
    const qaPlayingMedia = new Set();
    window.__qaFinishMedia = () => {
      const active = [...qaPlayingMedia];
      qaPlayingMedia.clear();
      for (const media of active) media.dispatchEvent(new Event('ended'));
      return active.length;
    };
    HTMLMediaElement.prototype.play = function qaPlay() {
      qaPlayingMedia.add(this);
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function qaPause() {
      qaPlayingMedia.delete(this);
      try { nativePause.call(this); } catch {}
    };
  });
}

async function finishQaMedia(page, cycles = 4) {
  for (let index = 0; index < cycles; index += 1) {
    const count = await page.evaluate(() => typeof window.__qaFinishMedia === 'function' ? window.__qaFinishMedia() : 0);
    if (!count) break;
    await page.clock.fastForward(250);
    await page.waitForTimeout(10);
  }
}

async function readMetrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const overflow = [];
    const smallTargets = [];
    const clippedText = [];

    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) continue;
      if (overflow.length < 25 && (rect.right > viewportWidth + 1 || rect.left < -1)) {
        overflow.push({
          tag: element.tagName.toLowerCase(),
          id: element.id || '',
          className: typeof element.className === 'string' ? element.className.slice(0, 160) : '',
          text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140),
          rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) },
        });
      }
      if (smallTargets.length < 30 && element.matches('button,a,input,textarea,select,[role="button"]')) {
        if (rect.width < 44 || rect.height < 44) {
          smallTargets.push({
            tag: element.tagName.toLowerCase(),
            text: String(element.textContent || element.getAttribute('aria-label') || element.getAttribute('title') || '')
              .trim().replace(/\s+/g, ' ').slice(0, 120),
            width: Math.round(rect.width * 10) / 10,
            height: Math.round(rect.height * 10) / 10,
          });
        }
      }
      if (clippedText.length < 20 && element.matches('button,a,h1,h2,h3,p,span,strong,small,summary,label')) {
        const horizontallyClipped = element.scrollWidth > element.clientWidth + 2;
        const verticallyClipped = element.scrollHeight > element.clientHeight + 2;
        const clipsOverflow = ['hidden', 'clip'].includes(style.overflow) || ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY);
        if ((horizontallyClipped || verticallyClipped) && clipsOverflow) {
          clippedText.push({
            tag: element.tagName.toLowerCase(),
            text: String(element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 140),
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth,
            clientHeight: element.clientHeight,
            scrollHeight: element.scrollHeight,
          });
        }
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
      },
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1,
      overflowingElements: overflow,
      smallTargets,
      clippedText,
      visibleButtons: [...document.querySelectorAll('button')]
        .filter((button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        })
        .map((button) => String(button.textContent || '').trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .slice(0, 50),
    };
  });
}

function addFinding(report, finding) {
  const key = JSON.stringify([finding.severity, finding.category, finding.state, finding.detail]);
  if (report._findingKeys.has(key)) return;
  report._findingKeys.add(key);
  report.findings.push(finding);
}

async function inspectNormalMode(page, report, stateName) {
  expect(page.url(), 'Normal-user QA must never enter dev mode.').not.toContain('dev=1');
  await expect(page.locator('.developer-toolbar')).toHaveCount(0);
  await expect(page.locator('.speaking-dev-tools')).toHaveCount(0);
  await expect(page.locator('.speaking-dev-skip-panel')).toHaveCount(0);

  if (await page.locator('.developer-entry-link').isVisible().catch(() => false)) {
    addFinding(report, {
      severity: 'medium',
      category: 'normal-mode-leak',
      state: stateName,
      detail: '通常利用者の画面に「開発者用確認」リンクが表示されています。',
    });
  }
}

async function captureState(page, report, stateName, { fullPage = false } = {}) {
  await inspectNormalMode(page, report, stateName);
  const prefix = `${safeName(report.device)}-${safeName(report.setKey)}-${safeName(stateName)}`;
  const viewportPng = path.join(screenshotRoot, `${prefix}-viewport.png`);
  const previewJpeg = path.join(screenshotRoot, `${prefix}-ai-preview.jpg`);
  fs.mkdirSync(screenshotRoot, { recursive: true });

  await page.screenshot({ path: viewportPng, type: 'png', fullPage: false, scale: 'device', animations: 'disabled' });
  await page.screenshot({ path: previewJpeg, type: 'jpeg', quality: 55, fullPage: false, scale: 'css', animations: 'disabled' });
  const files = [relativeToOutput(viewportPng), relativeToOutput(previewJpeg)];
  if (fullPage) {
    const fullPng = path.join(screenshotRoot, `${prefix}-full.png`);
    await page.screenshot({ path: fullPng, type: 'png', fullPage: true, scale: 'device', animations: 'disabled' });
    files.push(relativeToOutput(fullPng));
  }

  const stateMetrics = await readMetrics(page);
  report.states.push({
    name: stateName,
    capturedAt: new Date().toISOString(),
    url: page.url(),
    title: await page.title(),
    metrics: stateMetrics,
    screenshotFiles: files,
  });
  report.screenshotFiles.push(...files);

  if (stateMetrics.horizontalOverflow) {
    addFinding(report, { severity: 'high', category: 'layout', state: stateName, detail: 'ページ全体で横スクロールが発生しています。' });
  }
  if (stateMetrics.overflowingElements.length) {
    addFinding(report, { severity: 'medium', category: 'layout', state: stateName, detail: `画面外にはみ出す要素を${stateMetrics.overflowingElements.length}件検出しました。` });
  }
  if (stateMetrics.clippedText.length) {
    addFinding(report, { severity: 'low', category: 'text-clipping', state: stateName, detail: `切り詰め候補のテキスト要素を${stateMetrics.clippedText.length}件検出しました。` });
  }
  if (report.device.startsWith('iphone') && stateMetrics.smallTargets.length) {
    addFinding(report, { severity: 'low', category: 'touch-target', state: stateName, detail: `44×44px未満の操作要素を${stateMetrics.smallTargets.length}件検出しました。` });
  }
}

async function verifyProductionAudio(request, report, label, url) {
  if (qaTarget !== 'production-normal' || !url) return;
  const response = await request.get(url, { headers: { Range: 'bytes=0-4095', 'Cache-Control': 'no-cache' }, timeout: 30000 });
  const item = { label, url, status: response.status(), contentType: response.headers()['content-type'] || '' };
  report.audioProbes.push(item);
  expect([200, 206], `${label} audio HTTP status`).toContain(item.status);
  expect(item.contentType.toLowerCase(), `${label} audio content type`).toContain('audio');
}

async function runSpeakingPreflight(page, request, report) {
  await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
  await captureState(page, report, 'speaking-preflight');

  await page.locator('[data-action="grade2-speaking-next"]').click();
  await expect(page.locator('.speaking-stage-chip')).toContainText('受験前チェック 2/5');
  await page.locator('[data-action="grade2-speaking-output-test"]').click();
  await finishQaMedia(page, 2);
  await page.clock.fastForward(300);
  await verifyProductionAudio(request, report, 'Speaking sound check', speakingAudioProbe);
  await page.locator('[data-action="grade2-speaking-next"]').click();

  await expect(page.locator('.speaking-stage-chip')).toContainText('受験前チェック 3/5');
  await page.locator('[data-action="grade2-speaking-mic-check"]').click();
  await expect(page.locator('.speaking-check-message')).toContainText('マイクを確認できました');
  await captureState(page, report, 'speaking-microphone-check');
  await expect(page.locator('[data-action="grade2-speaking-next"]')).toBeEnabled();
  await page.locator('[data-action="grade2-speaking-next"]').click();

  await expect(page.locator('.speaking-stage-chip')).toContainText('受験前チェック 4/5');
  await page.locator('[data-action="grade2-speaking-test-record"]').click();
  await page.clock.fastForward(800);
  await expect(page.locator('[data-action="grade2-speaking-finish-answer"]')).toBeVisible();
  await page.locator('[data-action="grade2-speaking-finish-answer"]').click();

  await expect(page.locator('.speaking-stage-chip')).toContainText('受験前チェック 5/5');
  const confirm = page.locator('[data-action="grade2-speaking-test-confirm"]');
  await finishQaMedia(page, 2);
  await expect(confirm).toBeEnabled({ timeout: 10000 });
  await captureState(page, report, 'speaking-test-playback');
  await confirm.click();

  await expect(page.locator('[data-action="grade2-speaking-start-exam"]')).toBeVisible();
  await captureState(page, report, 'speaking-ready');
  await page.locator('[data-action="grade2-speaking-start-exam"]').click();
}

async function runSpeakingExam(page, report) {
  const captured = new Set();
  const stageHistory = [];

  for (let guard = 0; guard < 120; guard += 1) {
    if (await page.locator('[data-action="grade2-speaking-continue"]').isVisible().catch(() => false)) break;
    await expect(page.locator('.grade2-speaking-flow')).toBeVisible();

    const stage = String(await page.locator('.speaking-stage-chip').textContent().catch(() => '')).trim();
    const label = String(await page.locator('.grade2-speaking-panel h2').textContent().catch(() => '')).trim();
    const statusClass = String(await page.locator('.speaking-live-status').getAttribute('class').catch(() => ''));
    if (stage && stageHistory.at(-1) !== stage) stageHistory.push(stage);

    const captureMap = [
      [/Read Aloud/i, 'speaking-read-aloud'],
      [/^No\. 2$/i, 'speaking-no-2'],
      [/^No\. 4$/i, 'speaking-no-4'],
    ];
    for (const [pattern, name] of captureMap) {
      if (!captured.has(name) && (pattern.test(stage) || pattern.test(label))) {
        captured.add(name);
        await captureState(page, report, name);
      }
    }

    await finishQaMedia(page, 3);

    const choice = page.locator('[data-action="grade2-speaking-choice"][data-choice="yes"]');
    if (await choice.isVisible().catch(() => false)) {
      await choice.click();
      await page.clock.fastForward(1000);
      continue;
    }

    const finish = page.locator('[data-action="grade2-speaking-finish-answer"]');
    if (await finish.isVisible().catch(() => false)) {
      await finish.click();
      await page.clock.fastForward(900);
      continue;
    }

    const begin = page.locator('[data-action="grade2-speaking-begin"]');
    if (await begin.isVisible().catch(() => false)) {
      await begin.evaluate((element) => element.click()).catch(() => {});
      await page.clock.fastForward(300);
      continue;
    }

    if (statusClass.includes('prompting') || statusClass.includes('idle')) {
      await page.clock.fastForward(1200);
    } else if (statusClass.includes('counting')) {
      await page.clock.fastForward(65000);
    } else if (statusClass.includes('recording')) {
      await page.clock.fastForward(200);
    } else {
      await page.clock.fastForward(1500);
    }
    await page.waitForTimeout(20);
  }

  report.speakingStages = stageHistory;
  await expect(page.locator('[data-action="grade2-speaking-continue"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('.speaking-record-message.error')).toHaveCount(0);
  await captureState(page, report, 'speaking-complete', { fullPage: true });
  await page.locator('[data-action="grade2-speaking-continue"]').click();
}

async function driveListening(page, request, report) {
  await expect(page.locator('.listen-frame')).toBeVisible({ timeout: 15000 });
  const visited = [];

  for (let expectedId = 1; expectedId <= 30; expectedId += 1) {
    const number = page.locator('.listen-question-number');
    await expect(number).toHaveText(`No.${expectedId}`, { timeout: 5000 });
    visited.push(expectedId);

    if ([1, 16, 30].includes(expectedId)) {
      await captureState(page, report, `listening-no-${expectedId}`);
    }

    if ([1, 16].includes(expectedId)) {
      const src = await page.locator('[data-listening-audio]').getAttribute('src').catch(() => '');
      if (src) await verifyProductionAudio(request, report, `Listening No.${expectedId}`, new URL(src, page.url()).toString());
    }

    await finishQaMedia(page, 4);
    const play = page.locator('[data-action="listen-play"]');
    if (await play.isVisible().catch(() => false)) {
      const timer = String(await page.locator('[data-listening-timer]').textContent().catch(() => '')).trim();
      if (!timer || timer === '--') {
        await play.click();
        await finishQaMedia(page, 4);
      }
    }

    const choices = page.locator(`[data-action="listen-answer"][data-question="${expectedId}"]`);
    await expect(choices.first()).toBeVisible();
    await choices.first().click();
    await page.clock.fastForward(10100);
    await page.waitForTimeout(20);

    if (expectedId < 30) {
      await expect(number).toHaveText(`No.${expectedId + 1}`, { timeout: 5000 });
    }
  }

  report.listeningQuestionIds = visited;
  expect(visited).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
  await expect(page.locator('.reading-frame')).toBeVisible({ timeout: 10000 });
}

async function answerVisibleReading(page) {
  const ids = await page.locator('[data-action="written-answer"]').evaluateAll((els) => [...new Set(els.filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }).map((e) => e.dataset.question).filter(Boolean))]);
  for (const id of ids) {
    const button = page.locator(`[data-action="written-answer"][data-question="${id}"]`).first();
    await button.click();
  }
  return ids.map(Number);
}

async function driveReading(page, report) {
  await expect(page.locator('.reading-frame')).toBeVisible();
  const visitedQuestionIds = new Set();
  const visitedScreens = new Set();
  let capturedEmail = false;
  let capturedLong = false;
  let persistenceChecked = false;

  for (let guard = 0; guard < 40; guard += 1) {
    if (!await page.locator('.reading-frame').isVisible().catch(() => false)) break;
    const ids = await answerVisibleReading(page);
    ids.forEach((id) => visitedQuestionIds.add(id));
    const key = ids.join('-');
    visitedScreens.add(key);

    if (visitedScreens.size === 1) await captureState(page, report, 'reading-first');
    if (!capturedEmail && ids.some((id) => id >= 24 && id <= 26)) {
      capturedEmail = true;
      await captureState(page, report, 'reading-email');
    }
    if (!capturedLong && ids.some((id) => id >= 27)) {
      capturedLong = true;
      await captureState(page, report, 'reading-long-3b');
    }

    const next = page.locator('[data-action="reading-next"]');
    await expect(next).toBeVisible();

    if (!persistenceChecked && ids.length) {
      const firstId = ids[0];
      await next.click();
      const prev = page.locator('[data-action="reading-prev"]');
      await expect(prev).toBeVisible();
      await prev.click();
      const selected = page.locator(`[data-action="written-answer"][data-question="${firstId}"].selected`).first();
      await expect(selected).toBeVisible();
      persistenceChecked = true;
      await next.click();
      continue;
    }

    await next.click();
    await page.waitForTimeout(20);
  }

  report.readingQuestionIds = [...visitedQuestionIds].sort((a, b) => a - b);
  report.readingScreenGroups = [...visitedScreens];
  report.readingAnswerPersistenceChecked = persistenceChecked;
  expect(report.readingQuestionIds).toEqual(Array.from({ length: 31 }, (_, index) => index + 1));
  await expect(page.locator('.writing-frame, .exam-frame')).toBeVisible();
  await expect(page.locator('textarea.writing-textarea').first()).toBeVisible();
}

async function typeWritingAnswer(box, text) {
  await box.click();
  await box.pressSequentially(text, { delay: 0 });
  await expect(box).toHaveValue(text);
}

async function driveWriting(page, report) {
  const answers = [summaryAnswer, essayAnswer];
  for (let index = 0; index < answers.length; index += 1) {
    const box = page.locator('textarea.writing-textarea').first();
    await expect(box).toBeVisible();
    await typeWritingAnswer(box, answers[index]);
    await captureState(page, report, `writing-${index + 1}-filled`);
    await page.locator('[data-action="writing-next"]').click();
    await page.waitForTimeout(30);
  }

  const complete = page.locator('[data-action="complete-exam"]');
  await expect(complete).toBeVisible({ timeout: 5000 });
  await captureState(page, report, 'finish-confirmation');
  await complete.click();
  await expect(page.locator('.result-screen')).toBeVisible({ timeout: 10000 });
}

async function inspectResultAndReview(page, report, { restart = false } = {}) {
  await captureState(page, report, 'result', { fullPage: true });
  const listenReview = page.locator('[data-action="listen-review-open"]');
  await expect(listenReview).toBeVisible();
  await listenReview.click();
  await expect(page.locator('[data-action="listen-review-close"]')).toBeVisible();
  await captureState(page, report, 'listening-review');
  await page.locator('[data-action="listen-review-close"]').click();
  await expect(page.locator('.result-screen')).toBeVisible();

  if (restart) {
    const restartButton = page.locator('[data-action="restart"]');
    await expect(restartButton).toBeVisible();
    await restartButton.click();
    await expect(page.locator('button[data-action="start"]')).toBeVisible();
    await captureState(page, report, 'restart-clean');
  }
}

function actionableConsoleErrors(items) {
  return items.filter((item) => !/ERR_ABORTED|favicon|ResizeObserver loop/i.test(item.text || ''));
}

function actionableRequestFailures(items) {
  return items.filter((item) => !/ERR_ABORTED|NS_BINDING_ABORTED|cancelled|canceled|interrupted/i.test(item.errorText || ''));
}

fs.mkdirSync(partRoot, { recursive: true });
fs.mkdirSync(screenshotRoot, { recursive: true });

for (const setKey of setKeys) {
  test(`normal paid user completes ${setKey} without dev mode`, async ({ page, request }, testInfo) => {
    if (!baseUrl) throw new Error('QA_BASE_URL is required.');
    const report = {
      generatedAt: new Date().toISOString(),
      repository: process.env.QA_REPOSITORY || 'YutaTeru/cbt',
      commitSha: process.env.QA_EXPECTED_SHA || '',
      workflowRunId: process.env.QA_RUN_ID || '',
      target: qaTarget,
      baseUrl,
      device: testInfo.project.name,
      setKey,
      actions: [],
      states: [],
      findings: [],
      audioProbes: [],
      consoleErrors: [],
      pageErrors: [],
      requestFailures: [],
      screenshotFiles: [],
      testPassed: false,
      failure: null,
      _findingKeys: new Set(),
    };

    page.on('console', (message) => {
      if (message.type() === 'error') report.consoleErrors.push({ text: message.text(), location: message.location() });
    });
    page.on('pageerror', (error) => report.pageErrors.push({ name: error.name, message: error.message, stack: error.stack || '' }));
    page.on('requestfailed', (requestObject) => report.requestFailures.push({
      url: requestObject.url(),
      resourceType: requestObject.resourceType(),
      errorText: requestObject.failure()?.errorText || '',
    }));

    try {
      await installBrowserTestDoubles(page);
      await page.clock.install({ time: new Date('2026-08-23T12:00:00Z') });

      if (qaTarget !== 'production-normal') {
        const wav = makeSilentWav();
        await page.route('**/audio-r2/**', (route) => route.fulfill({ status: 200, contentType: 'audio/wav', body: wav }));
        await page.route(/\.wav(?:\?|$)/i, (route) => route.fulfill({ status: 200, contentType: 'audio/wav', body: wav }));
      }

      const url = `${baseUrl}/exam.html?plan=three&set=${setKey}&fresh=1&qa-normal=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'manual')}`;
      report.actions.push('Open normal paid CBT URL with no dev parameter.');
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#app')).toBeVisible();
      await expect(page.locator(`.set-option.active[data-set="${setKey}"]`)).toBeVisible();
      await captureState(page, report, 'start', { fullPage: true });

      report.actions.push('Click the real Start button.');
      await page.locator('button[data-action="start"]').first().click();
      await runSpeakingPreflight(page, request, report);

      report.actions.push('Complete Speaking with normal controls, QA microphone input, and accelerated timers only.');
      await runSpeakingExam(page, report);

      report.actions.push('Continue to Listening and answer all 30 questions through normal auto-advance.');
      await driveListening(page, request, report);

      report.actions.push('Traverse all Reading questions with normal Next/Previous controls and verify answer persistence.');
      await driveReading(page, report);

      report.actions.push('Type both Writing answers and confirm completion through the real finish modal.');
      await driveWriting(page, report);

      report.actions.push('Inspect result screen, open/close Listening review, and verify restart on Set 01.');
      await inspectResultAndReview(page, report, { restart: setKey === 'set-01' });

      report.actionableConsoleErrors = actionableConsoleErrors(report.consoleErrors);
      report.actionableRequestFailures = actionableRequestFailures(report.requestFailures);
      if (report.pageErrors.length) throw new Error(`Page errors: ${JSON.stringify(report.pageErrors)}`);
      if (report.actionableConsoleErrors.length) throw new Error(`Console errors: ${JSON.stringify(report.actionableConsoleErrors)}`);

      report.testPassed = true;
    } catch (error) {
      report.failure = { name: error?.name || 'Error', message: error?.message || String(error), stack: error?.stack || '' };
      try { await captureState(page, report, 'failure-evidence', { fullPage: true }); } catch {}
      throw error;
    } finally {
      report.completedAt = new Date().toISOString();
      report.currentUrl = page.url();
      report.pageTitle = await page.title().catch(() => '');
      report.actionableConsoleErrors = actionableConsoleErrors(report.consoleErrors);
      report.actionableRequestFailures = actionableRequestFailures(report.requestFailures);
      delete report._findingKeys;
      const filePath = path.join(partRoot, `${safeName(testInfo.project.name)}-${safeName(setKey)}.json`);
      writeJsonAtomic(filePath, report);
    }
  });
}
