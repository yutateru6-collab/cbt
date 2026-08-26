const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');
const screenshotRoot = path.resolve(process.cwd(), 'qa-output', 'screenshots');

function examUrl({ plan, set }) {
  return `${baseUrl}/exam.html?plan=${encodeURIComponent(plan)}&set=${encodeURIComponent(set)}&dev=1&fresh=1&qa-flow=1`;
}

async function installSpeakingFlowHarness(page) {
  await page.evaluate(() => {
    window.__qaSpeakingPrompts = [];
    window.__qaRecordingStarts = [];

    playGrade2SpeakingAudioPrompt = async function qaPlayGrade2SpeakingAudioPrompt(audioUrl) {
      window.__qaSpeakingPrompts.push(String(audioUrl || ''));
    };
    startSpeakingRecording = async function qaStartSpeakingRecording() {
      const step = speakingSteps[appState.speakingStep];
      window.__qaRecordingStarts.push(step?.id || 'unknown');
      return true;
    };
    stopSpeakingRecording = async function qaStopSpeakingRecording() {
      return true;
    };
    isSpeakingRecordingActive = function qaIsSpeakingRecordingActive() {
      return false;
    };
  });
}

async function moveSpeakingTo(page, id, status = 'recording') {
  await page.evaluate(({ id, status }) => {
    const index = speakingSteps.findIndex((step) => step.id === id);
    if (index < 0) throw new Error(`Missing Speaking step: ${id}`);
    grade2SpeakingActivationToken += 1;
    grade2SpeakingDeadline = 0;
    grade2SpeakingAdvanceInProgress = false;
    appState.started = true;
    appState.module = 'speaking';
    appState.modal = null;
    appState.speakingStep = index;
    appState.speakingPhaseStatus = status;
    appState.speakingRemaining = getSpeakingStepSeconds(index);
    appState.speakingRecordMessage = '';
    render();
  }, { id, status });
}

async function waitForPrompt(page, suffix) {
  await expect.poll(
    () => page.evaluate((expected) => window.__qaSpeakingPrompts.some((url) => url.endsWith(expected)), suffix),
    { timeout: 5000 },
  ).toBe(true);
}

test('Grade 2 Speaking sample keeps the same complete step structure as paid sets', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440x900', 'Cross-set flow structure only needs one deterministic desktop run.');

  const cases = [
    { plan: 'sample', set: 'sample' },
    { plan: 'three', set: 'set-01' },
    { plan: 'three', set: 'set-02' },
    { plan: 'three', set: 'set-03' },
  ];
  const requiredOrder = [
    'preflight',
    'output-check',
    'microphone-check',
    'test-recording',
    'test-playback',
    'section-start',
    'grade-introduction',
    'warmup-introduction',
    'warmup-1',
    'warmup-2',
    'card-introduction',
    'silent-reading',
    'read-aloud',
    'no-1',
    'no-2-preparation',
    'no-2',
    'turn-card',
    'no-3',
    'no-4',
    'section-finish',
    'review',
  ];

  for (const item of cases) {
    await page.goto(examUrl(item), { waitUntil: 'domcontentloaded' });
    const ids = await page.evaluate(() => speakingSteps.map((step) => step.id));
    expect(ids).toEqual(requiredOrder);
  }
});

test('Grade 2 Speaking early-finish path always plays No.1, No.3 and No.4 before recording', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440x900', 'Cross-set audio sequencing runs once on deterministic Chromium.');

  const cases = [
    { plan: 'sample', set: 'sample', scope: 'sample' },
    { plan: 'three', set: 'set-01', scope: 'set-01' },
    { plan: 'three', set: 'set-02', scope: 'set-02' },
    { plan: 'three', set: 'set-03', scope: 'set-03' },
  ];

  for (const item of cases) {
    await page.goto(examUrl(item), { waitUntil: 'domcontentloaded' });
    await installSpeakingFlowHarness(page);

    await moveSpeakingTo(page, 'read-aloud');
    await page.locator('[data-action="grade2-speaking-finish-answer"]').click();
    await waitForPrompt(page, `/${item.scope}/no-1.wav`);
    await expect.poll(() => page.evaluate(() => window.__qaRecordingStarts.includes('no-1'))).toBe(true);

    await moveSpeakingTo(page, 'no-2');
    await page.locator('[data-action="grade2-speaking-finish-answer"]').click();
    await waitForPrompt(page, '/common/turn-card.wav');
    await page.evaluate(async () => {
      await finishGrade2TimedStep();
    });
    await waitForPrompt(page, `/${item.scope}/no-3.wav`);
    await expect.poll(() => page.evaluate(() => window.__qaRecordingStarts.includes('no-3'))).toBe(true);

    await moveSpeakingTo(page, 'no-3');
    await page.locator('[data-action="grade2-speaking-finish-answer"]').click();
    await waitForPrompt(page, `/${item.scope}/no-4.wav`);
    await expect(page.locator('[data-action="grade2-speaking-choice"][data-choice="yes"]')).toBeVisible();
    await expect(page.locator('[data-action="grade2-speaking-choice"][data-choice="no"]')).toBeVisible();
    await expect(page.locator('[data-speaking-timer]')).toHaveCount(0);
    expect(await page.evaluate(() => appState.speakingPhaseStatus)).toBe('awaiting-choice');
    expect(await page.evaluate(() => window.__qaRecordingStarts.includes('no-4'))).toBe(false);

    await page.locator('[data-action="grade2-speaking-choice"][data-choice="yes"]').click();
    await waitForPrompt(page, '/common/why.wav');
    await expect.poll(() => page.evaluate(() => window.__qaRecordingStarts.includes('no-4'))).toBe(true);
  }
});

test('Grade 2 Speaking completion uses a readable one-column download layout', async ({ page }, testInfo) => {
  await page.goto(examUrl({ plan: 'sample', set: 'sample' }), { waitUntil: 'domcontentloaded' });

  await page.evaluate(() => {
    const scoredIds = ['read-aloud', 'no-1', 'no-2', 'no-3', 'no-4'];
    for (const id of scoredIds) {
      const index = speakingSteps.findIndex((step) => step.id === id);
      appState.speakingRecordings[index] = {
        fileName: `qa-${id}.webm`,
        type: 'audio/webm',
        size: 4096,
        createdAt: new Date().toISOString(),
      };
    }
    appState.started = true;
    appState.module = 'speaking';
    appState.speakingStep = speakingSteps.findIndex((step) => step.id === 'review');
    appState.speakingPhaseStatus = 'idle';
    appState.speakingRecordMessage = '';
    render();
  });

  const stage = page.locator('.grade2-speaking-stage');
  const panel = page.locator('.grade2-speaking-panel');
  const downloads = page.locator('.grade2-speaking-end-downloads');
  const heading = downloads.getByRole('heading', { name: '録音を端末へ保存' });

  await expect(downloads).toBeVisible();
  await expect(heading).toBeVisible();
  await expect(page.locator('[data-action="speaking-record-download"]')).toHaveCount(5);
  await expect(stage).toBeHidden();

  const metrics = await page.evaluate(() => {
    const body = document.querySelector('.grade2-speaking-body');
    const panel = document.querySelector('.grade2-speaking-panel');
    const downloads = document.querySelector('.grade2-speaking-end-downloads');
    const heading = downloads?.querySelector('h3');
    const panelRect = panel?.getBoundingClientRect();
    const downloadRect = downloads?.getBoundingClientRect();
    const headingRect = heading?.getBoundingClientRect();
    return {
      viewport: window.innerWidth,
      bodyColumns: body ? getComputedStyle(body).gridTemplateColumns : '',
      panelWidth: panelRect?.width || 0,
      downloadWidth: downloadRect?.width || 0,
      headingWidth: headingRect?.width || 0,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });

  expect(metrics.horizontalOverflow).toBe(false);
  expect(metrics.bodyColumns.trim().split(/\s+/)).toHaveLength(1);
  expect(metrics.panelWidth).toBeGreaterThan(Math.min(300, metrics.viewport - 40));
  expect(metrics.downloadWidth).toBeGreaterThan(Math.min(240, metrics.viewport - 80));
  expect(metrics.headingWidth).toBeGreaterThan(Math.min(180, metrics.viewport - 100));

  if (testInfo.project.name === 'desktop-1440x900' || testInfo.project.name === 'laptop-1366x768') {
    fs.mkdirSync(screenshotRoot, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotRoot, `${testInfo.project.name}-grade2-speaking-download-layout.png`),
      fullPage: false,
    });
  }

  await expect(panel).toBeVisible();
});
