const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');
const screenshotRoot = path.resolve(process.cwd(), 'qa-output', 'screenshots');

function makeSilentWav({ seconds = 2, sampleRate = 16000 } = {}) {
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

async function stubAudio(page) {
  const wav = makeSilentWav();
  await page.route('**/audio-r2/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'audio/wav', body: wav });
  });
}

function examUrl({ plan = 'three', set = 'set-01', extra = '' } = {}) {
  const suffix = extra ? `&${extra}` : '';
  return `${baseUrl}/exam.html?plan=${encodeURIComponent(plan)}&set=${encodeURIComponent(set)}&dev=1&fresh=1&qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}${suffix}`;
}

function screenshotPath(projectName, label) {
  fs.mkdirSync(screenshotRoot, { recursive: true });
  return path.join(screenshotRoot, `${projectName}-${label}.png`);
}

test('Grade 2 Speaking uses the required timing contract in sample and Sets 1-3', async ({ page }) => {
  await stubAudio(page);
  const cases = [
    { plan: 'sample', set: 'sample' },
    { plan: 'three', set: 'set-01' },
    { plan: 'three', set: 'set-02' },
    { plan: 'three', set: 'set-03' },
  ];
  const expected = {
    'silent-reading': 20,
    'read-aloud': 60,
    'no-1': 30,
    'no-2-preparation': 20,
    'no-2': 90,
    'no-3': 35,
    'no-4': 35,
  };

  for (const item of cases) {
    await page.goto(examUrl(item), { waitUntil: 'domcontentloaded' });
    const actual = await page.evaluate(() => Object.fromEntries(
      speakingSteps
        .filter((step) => ['silent-reading', 'read-aloud', 'no-1', 'no-2-preparation', 'no-2', 'no-3', 'no-4'].includes(step.id))
        .map((step) => [step.id, step.seconds]),
    ));
    expect(actual).toEqual(expected);
  }
});

test('Speaking No.2/No.3 UI shows 90s/35s and library evidence is reconstructable', async ({ page }, testInfo) => {
  await stubAudio(page);
  await page.goto(examUrl({ plan: 'sample', set: 'sample' }), { waitUntil: 'domcontentloaded' });

  const libraryContract = await page.evaluate(() => {
    const no1 = speakingSteps.find((step) => step.id === 'no-1');
    return {
      cardText: no1?.cardText || '',
      modelAnswer: no1?.modelAnswer || '',
    };
  });
  expect(libraryContract.cardText).toContain('libraries that have tool-lending programs');
  expect(libraryContract.cardText).toContain('such libraries');
  expect(libraryContract.modelAnswer).toContain('libraries that have tool-lending programs');

  await page.evaluate(() => {
    appState.started = true;
    appState.module = 'speaking';
    appState.speakingStep = speakingSteps.findIndex((step) => step.id === 'no-2');
    appState.speakingPhaseStatus = 'recording';
    appState.speakingRemaining = 90;
    render();
  });
  await expect(page.locator('[data-speaking-timer]')).toHaveText('01:30');

  await page.evaluate(() => {
    appState.speakingStep = speakingSteps.findIndex((step) => step.id === 'no-3');
    appState.speakingPhaseStatus = 'recording';
    appState.speakingRemaining = 35;
    render();
  });
  await expect(page.locator('[data-speaking-timer]')).toHaveText('00:35');
  await page.screenshot({ path: screenshotPath(testInfo.project.name, 'speaking-no3-35s'), fullPage: true });
});

test('Listening shows 30 number slots, PC uses two section columns, and volume reaches real 0%', async ({ page }, testInfo) => {
  await stubAudio(page);
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto(examUrl({ plan: 'three', set: 'set-01', extra: 'module=listening&question=1&start=1' }), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(350);

  await expect(page.locator('.listen-section-part1 .listen-list-row')).toHaveCount(15);
  await expect(page.locator('.listen-section-part2 .listen-list-row')).toHaveCount(15);

  const grid = await page.evaluate(() => ({
    width: window.innerWidth,
    columns: getComputedStyle(document.querySelector('.listen-list')).gridTemplateColumns,
    part1Columns: getComputedStyle(document.querySelector('.listen-section-part1 .listen-section-grid')).gridTemplateColumns,
    part2Columns: getComputedStyle(document.querySelector('.listen-section-part2 .listen-section-grid')).gridTemplateColumns,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  expect(grid.horizontalOverflow).toBe(false);
  if (grid.width >= 768) {
    expect(grid.columns.trim().split(/\s+/)).toHaveLength(2);
    expect(grid.part1Columns.trim().split(/\s+/)).toHaveLength(1);
    expect(grid.part2Columns.trim().split(/\s+/)).toHaveLength(1);
  }

  const volume = page.locator('[data-speaking-volume]').first();
  await volume.evaluate((element) => {
    element.value = '0';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const atZero = await page.evaluate(() => ({
    state: appState.speakingOutputVolume,
    output: getGrade2OutputVolume(),
    mainAudio: listeningAudioElement ? listeningAudioElement.volume : null,
    instructionAudio: listeningInstructionAudioElement ? listeningInstructionAudioElement.volume : null,
  }));
  expect(atZero.state).toBe(0);
  expect(atZero.output).toBe(0);
  if (atZero.mainAudio !== null) expect(atZero.mainAudio).toBe(0);
  if (atZero.instructionAudio !== null) expect(atZero.instructionAudio).toBe(0);

  await volume.evaluate((element) => {
    element.value = '100';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const atHundred = await page.evaluate(() => ({
    state: appState.speakingOutputVolume,
    output: getGrade2OutputVolume(),
    expectedListening: getListeningAudioVolume(listeningQuestions[appState.listeningIndex]),
    mainAudio: listeningAudioElement ? listeningAudioElement.volume : null,
    instructionAudio: listeningInstructionAudioElement ? listeningInstructionAudioElement.volume : null,
  }));
  expect(atHundred.state).toBe(100);
  expect(atHundred.output).toBe(1);
  if (atHundred.mainAudio !== null) expect(atHundred.mainAudio).toBeCloseTo(atHundred.expectedListening, 6);
  if (atHundred.instructionAudio !== null) expect(atHundred.instructionAudio).toBeCloseTo(atHundred.expectedListening, 6);

  await page.screenshot({ path: screenshotPath(testInfo.project.name, 'listening-two-column-volume'), fullPage: true });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter((text) => !/ERR_ABORTED/i.test(text))).toEqual([]);
});

test('Speaking end screen exposes enabled bulk download and an individual recording downloads', async ({ page }) => {
  await stubAudio(page);
  await page.goto(examUrl({ plan: 'three', set: 'set-01' }), { waitUntil: 'domcontentloaded' });

  const prepared = await page.evaluate(async () => {
    const scoredIds = ['read-aloud', 'no-1', 'no-2', 'no-3', 'no-4'];
    for (const id of scoredIds) {
      const stepIndex = speakingSteps.findIndex((step) => step.id === id);
      const blob = new Blob([`qa-${id}`], { type: 'audio/webm' });
      const createdAt = new Date().toISOString();
      const fileName = buildSpeakingRecordingFileName(stepIndex, blob.type);
      await putSpeakingRecord({
        key: getSpeakingRecordingKey(stepIndex),
        grade: selectedGrade,
        setKey: selectedSet.key,
        stepIndex,
        fileName,
        type: blob.type,
        size: blob.size,
        createdAt,
        blob,
      });
      appState.speakingRecordings[stepIndex] = { fileName, type: blob.type, size: blob.size, createdAt };
    }
    appState.started = true;
    appState.module = 'speaking';
    appState.speakingStep = speakingSteps.findIndex((step) => step.id === 'review');
    appState.speakingPhaseStatus = 'idle';
    render();
    return speakingSteps.findIndex((step) => step.id === 'no-2');
  });

  const bulk = page.locator('[data-action="grade2-speaking-download-all"]');
  await expect(bulk).toBeVisible();
  await expect(bulk).toBeEnabled();
  await expect(page.locator('[data-action="speaking-record-download"]')).toHaveCount(5);

  const individual = page.locator(`[data-action="speaking-record-download"][data-step="${prepared}"]`);
  const downloadPromise = page.waitForEvent('download');
  await individual.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/grade2-set-01-speaking-no-2\.(?:webm|mp4|ogg)$/);
});
