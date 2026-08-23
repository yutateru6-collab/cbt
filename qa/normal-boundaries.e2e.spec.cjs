const { test, expect } = require('@playwright/test');

const PROD = 'https://cbt.itisnowornever271.workers.dev';

async function openNormal(page, suffix) {
  await page.goto(`${PROD}/exam.html?plan=three&set=set-01&fresh=1&qa-boundary=${suffix}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  expect(page.url()).not.toContain('dev=1');
  await expect(page.locator('.developer-toolbar')).toHaveCount(0);
  await expect(page.locator('.speaking-dev-tools')).toHaveCount(0);
}

async function assertHealthy(page) {
  const info = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(info.horizontalOverflow).toBe(false);
}

test('normal listening final countdown resumes and hands off to Reading', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));

  await openNormal(page, 'listening-reading');
  await page.locator('button[data-action="start"]').click();
  await expect(page.locator('.grade2-speaking-flow')).toBeVisible();

  await page.evaluate(() => {
    // Build the same persisted state the normal app uses when a Listening answer
    // countdown is already active, then let render()/ensureListeningPlaybackState()
    // resume that normal countdown path.
    cancelListeningAnswerCountdown();
    appState.module = 'listening';
    appState.started = true;
    appState.listeningIndex = listeningQuestions.length - 1;
    appState.listeningReviewMode = false;
    const q = listeningQuestions[appState.listeningIndex];
    const deadline = Date.now() + 700;
    appState.listeningAnswerRemaining = 1;
    appState.listeningAnswerDeadline = deadline;
    appState.listeningCountdownQuestionId = q.id;
    listeningAnswerDeadline = deadline;
    listeningPlaybackQuestionId = null;
    listeningPlaybackPhase = 'idle';
    saveState();
    render();
  });

  await expect(page.locator('.listen-frame')).toBeVisible();
  await assertHealthy(page);
  await page.screenshot({ path: `qa-output/${test.info().project.name}-boundary-listening.png`, fullPage: false });

  await expect(page.locator('.reading-frame')).toBeVisible({ timeout: 5000 });
  expect(page.url()).toContain('module=reading');
  expect(page.url()).not.toContain('dev=1');
  await assertHealthy(page);
  await page.screenshot({ path: `qa-output/${test.info().project.name}-boundary-reading.png`, fullPage: false });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(x => !/favicon|ERR_ABORTED/i.test(x))).toEqual([]);
});

test('normal Reading traverses to Writing, finish confirmation, and result', async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => pageErrors.push(e.message));

  await openNormal(page, 'reading-result');
  await page.locator('button[data-action="start"]').click();
  await expect(page.locator('.grade2-speaking-flow')).toBeVisible();

  await page.evaluate(() => {
    stopListeningPlayback();
    appState.module = 'reading';
    appState.started = true;
    appState.readingPage = 0;
    appState.readingItemIndex = 0;
    appState.modal = null;
    saveState();
    syncGrade2ModuleUrl('reading', { started: true });
    render();
  });

  await expect(page.locator('.reading-frame')).toBeVisible();
  await assertHealthy(page);

  let screens = 0;
  while (await page.locator('.reading-frame').isVisible().catch(() => false)) {
    screens += 1;
    if (screens > 30) throw new Error('Reading navigation exceeded 30 screens');
    const qids = await page.locator('[data-action="written-answer"]').evaluateAll(els => [...new Set(els.map(e => e.dataset.question).filter(Boolean))]);
    for (const qid of qids) {
      const first = page.locator(`[data-action="written-answer"][data-question="${qid}"]`).first();
      if (await first.isVisible().catch(() => false)) await first.click();
    }
    const next = page.locator('[data-action="reading-next"]');
    await expect(next).toBeVisible();
    await next.click();
    await page.waitForTimeout(80);
  }

  expect(screens).toBeGreaterThan(1);
  await expect(page.locator('textarea.writing-textarea')).toBeVisible({ timeout: 5000 });
  expect(page.url()).toContain('module=writing');
  expect(page.url()).not.toContain('dev=1');
  await assertHealthy(page);
  await page.screenshot({ path: `qa-output/${test.info().project.name}-boundary-writing.png`, fullPage: false });

  for (let task = 0; task < 2; task += 1) {
    const box = page.locator('textarea.writing-textarea').first();
    await expect(box).toBeVisible();
    await box.fill('Many students use online tools to study English because they can practice at any time. However, they should also think carefully and review their own mistakes so that they do not depend on automatic answers for everything.');
    const next = page.locator('[data-action="writing-next"]');
    await expect(next).toBeVisible();
    await next.click();
    await page.waitForTimeout(120);
  }

  await expect(page.locator('[data-action="complete-exam"]')).toBeVisible({ timeout: 5000 });
  await page.screenshot({ path: `qa-output/${test.info().project.name}-boundary-finish-confirm.png`, fullPage: false });
  await page.locator('[data-action="complete-exam"]').click();
  await expect(page.locator('.result-screen')).toBeVisible({ timeout: 7000 });
  await assertHealthy(page);
  await page.screenshot({ path: `qa-output/${test.info().project.name}-boundary-result.png`, fullPage: true });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors.filter(x => !/favicon|ERR_ABORTED/i.test(x))).toEqual([]);
});
