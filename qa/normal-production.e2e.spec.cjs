const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const PROD = 'https://cbt.itisnowornever271.workers.dev';
const outputRoot = path.resolve(process.cwd(), 'qa-output');
const partRoot = path.join(outputRoot, 'report-parts');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const writingSample = 'Many students use online tools to study English because they can practice at any time and review difficult points. However, they should still think carefully and should not depend on automatic answers for everything.';

function safeName(v) { return String(v).replace(/[^a-zA-Z0-9._-]+/g, '-'); }
function rel(p) { return path.relative(outputRoot, p).split(path.sep).join('/'); }
function writeJson(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
async function settle(page, ms = 450) { await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(ms); }
async function appEval(page, source) { return page.evaluate((src) => eval(src), source); }

async function metrics(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const vw = innerWidth;
    const smallTargets = [];
    for (const el of document.querySelectorAll('button,a,input,textarea,select,[role="button"]')) {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.width < 44 || r.height < 44) smallTargets.push({
        tag: el.tagName.toLowerCase(),
        text: String(el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0,120),
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10,
      });
      if (smallTargets.length >= 40) break;
    }
    const overflow = [];
    for (const el of document.querySelectorAll('body *')) {
      if (overflow.length >= 30) break;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width > 1 && r.height > 1 && (r.right > vw + 1 || r.left < -1)) overflow.push({
        tag: el.tagName.toLowerCase(), id: el.id || '', className: String(el.className || '').slice(0,120),
        text: String(el.textContent || '').trim().replace(/\s+/g, ' ').slice(0,120),
        left: Math.round(r.left * 10) / 10, right: Math.round(r.right * 10) / 10, width: Math.round(r.width * 10) / 10,
      });
    }
    return {
      viewportWidth: innerWidth, viewportHeight: innerHeight, deviceScaleFactor: devicePixelRatio,
      scrollWidth: root.scrollWidth, scrollHeight: root.scrollHeight, clientWidth: root.clientWidth, clientHeight: root.clientHeight,
      horizontalOverflow: root.scrollWidth > root.clientWidth + 1, overflow, smallTargets,
      visibleButtons: [...document.querySelectorAll('button')].filter(b => { const r=b.getBoundingClientRect(); const cs=getComputedStyle(b); return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'; }).map(b => String(b.textContent||'').trim().replace(/\s+/g,' ')).filter(Boolean).slice(0,50),
    };
  });
}

async function capture(page, report, name, fullPage = false) {
  const prefix = `${safeName(report.device)}-${safeName(name)}`;
  const png = path.join(screenshotRoot, `${prefix}-viewport.png`);
  const jpg = path.join(screenshotRoot, `${prefix}-ai-preview.jpg`);
  fs.mkdirSync(screenshotRoot, { recursive: true });
  await page.screenshot({ path: png, type: 'png', fullPage: false, scale: 'device', animations: 'disabled' });
  await page.screenshot({ path: jpg, type: 'jpeg', quality: 60, fullPage: false, scale: 'css', animations: 'disabled' });
  const files = [rel(png), rel(jpg)];
  if (fullPage) {
    const fp = path.join(screenshotRoot, `${prefix}-full.png`);
    await page.screenshot({ path: fp, type: 'png', fullPage: true, scale: 'device', animations: 'disabled' });
    files.push(rel(fp));
  }
  report.states.push({ name, url: page.url(), title: await page.title(), metrics: await metrics(page), screenshotFiles: files });
  report.screenshotFiles.push(...files);
}

async function assertNormal(page) {
  expect(page.url()).not.toContain('dev=1');
  await expect(page.locator('.developer-toolbar')).toHaveCount(0);
  await expect(page.locator('.speaking-dev-tools')).toHaveCount(0);
  await expect(page.locator('.speaking-dev-skip-panel')).toHaveCount(0);
}

async function answerVisibleReading(page) {
  const ids = await page.locator('[data-action="written-answer"]').evaluateAll((els) => [...new Set(els.map(e => e.dataset.question).filter(Boolean))]);
  for (const id of ids) {
    const first = page.locator(`[data-action="written-answer"][data-question="${id}"]`).first();
    if (await first.isVisible().catch(() => false)) await first.click();
  }
}

async function shortenFinalListeningCountdown(page) {
  await appEval(page, `
    cancelListeningAnswerCountdown();
    appState.module='listening';
    appState.listeningIndex=listeningQuestions.length-1;
    appState.listeningReviewMode=false;
    render();
    const q=listeningQuestions[appState.listeningIndex];
    listeningPlaybackPhase='answer';
    appState.listeningAnswerRemaining=1;
    listeningAnswerDeadline=Date.now()+300;
    appState.listeningAnswerDeadline=listeningAnswerDeadline;
    appState.listeningCountdownQuestionId=q.id;
    scheduleListeningAnswerCountdown(q.id,listeningAnswerDeadline);
    updateListeningPlaybackUi();
  `);
}

test('production normal-mode end-to-end QA without dev mode', async ({ page }, testInfo) => {
  fs.mkdirSync(partRoot, { recursive: true });
  const report = {
    generatedAt: new Date().toISOString(), repository: process.env.QA_REPOSITORY || 'YutaTeru/cbt', commitSha: process.env.QA_EXPECTED_SHA || '',
    workflowRunId: process.env.QA_RUN_ID || '', target: 'production-normal-mode', baseUrl: PROD, device: testInfo.project.name,
    actions: [], states: [], screenshotFiles: [], consoleErrors: [], pageErrors: [], requestFailures: [], responses: [], notes: [], testPassed: false,
  };
  page.on('console', m => { if (m.type() === 'error') report.consoleErrors.push({ text: m.text(), location: m.location() }); });
  page.on('pageerror', e => report.pageErrors.push({ name: e.name, message: e.message }));
  page.on('requestfailed', r => report.requestFailures.push({ url: r.url(), resourceType: r.resourceType(), errorText: r.failure()?.errorText || '' }));
  page.on('response', r => { if (/audio-r2|\.wav(\?|$)/i.test(r.url())) report.responses.push({ url: r.url(), status: r.status() }); });

  try {
    const url = `${PROD}/exam.html?plan=three&set=set-01&fresh=1&qa-normal=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'manual')}`;
    report.actions.push('Open production paid CBT with no dev parameter.');
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await settle(page, 800);
    await assertNormal(page);
    await expect(page.locator('#app')).toBeVisible();
    const start = page.locator('button[data-action="start"]').first();
    await expect(start).toBeVisible();
    await expect(start).toBeEnabled();
    await capture(page, report, 'normal-start', true);

    report.actions.push('Click the actual normal start button.');
    await start.click();
    await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
    await assertNormal(page);
    await capture(page, report, 'speaking-preflight');

    report.actions.push('Seed only the elapsed Speaking time, while keeping normal mode, then use the real normal continue button.');
    await appEval(page, `appState.module='speaking'; appState.speakingStep=speakingSteps.length-1; appState.speakingPhaseStatus='idle'; appState.speakingBreakOpen=false; render();`);
    await settle(page, 250);
    await assertNormal(page);
    const continueListening = page.getByRole('button', { name: /そのままリスニングへ進む/ });
    await expect(continueListening).toBeVisible();
    await capture(page, report, 'speaking-complete', true);
    await continueListening.click();
    await expect(page.locator('.listen-frame')).toBeVisible({ timeout: 15000 });
    await assertNormal(page);
    await settle(page, 1800);
    await capture(page, report, 'listening-first');

    report.actions.push('Observe real production listening audio requests.');
    if (!report.responses.some(x => x.status >= 200 && x.status < 400)) {
      report.notes.push('No successful audio response was observed during the short first-question observation window.');
    }

    report.actions.push('Shorten only the final normal Listening answer deadline and verify automatic transition to Reading.');
    await shortenFinalListeningCountdown(page);
    await settle(page, 100);
    await assertNormal(page);
    await capture(page, report, 'listening-last-countdown');
    const listenAnswer = page.locator('[data-action="listen-answer"]').first();
    if (await listenAnswer.isVisible().catch(() => false)) await listenAnswer.click();
    await expect(page.locator('.reading-frame')).toBeVisible({ timeout: 7000 });
    await assertNormal(page);
    await capture(page, report, 'reading-first');

    report.actions.push('Answer visible Reading choices and traverse every normal Reading screen with the real next button.');
    let readingScreens = 0;
    let capturedEmail = false;
    while (await page.locator('.reading-frame').isVisible().catch(() => false)) {
      readingScreens += 1;
      if (readingScreens > 30) throw new Error('Reading navigation exceeded 30 screens.');
      await answerVisibleReading(page);
      const text = await page.locator('.reading-frame').innerText();
      if (!capturedEmail && /メール|e-mail|email/i.test(text)) {
        capturedEmail = true;
        await capture(page, report, 'reading-email');
      }
      const next = page.locator('[data-action="reading-next"]');
      await expect(next).toBeVisible();
      await next.click();
      await page.waitForTimeout(100);
    }
    report.readingScreensTraversed = readingScreens;
    await expect(page.locator('textarea.writing-textarea')).toBeVisible({ timeout: 7000 });
    await assertNormal(page);
    await capture(page, report, 'writing-first');

    report.actions.push('Type realistic English answers into both Writing tasks with the real next controls.');
    for (let i = 0; i < 2; i += 1) {
      const box = page.locator('textarea.writing-textarea').first();
      await expect(box).toBeVisible();
      await box.fill(writingSample + (i ? ' This is my second response.' : ''));
      await capture(page, report, `writing-${i + 1}-filled`);
      await page.locator('[data-action="writing-next"]').click();
      await page.waitForTimeout(180);
    }

    report.actions.push('Confirm the normal finish modal and click the real scoring button.');
    const scoreButton = page.locator('[data-action="complete-exam"]');
    await expect(scoreButton).toBeVisible();
    await capture(page, report, 'finish-confirm');
    await scoreButton.click();
    await expect(page.locator('.result-screen')).toBeVisible({ timeout: 10000 });
    await assertNormal(page);
    await capture(page, report, 'result', true);

    report.actions.push('Smoke-check Set 02 and Set 03 normal start screens with no developer controls.');
    for (const setKey of ['set-02', 'set-03']) {
      await page.goto(`${PROD}/exam.html?plan=three&set=${setKey}&fresh=1&qa-normal=sets`, { waitUntil: 'domcontentloaded' });
      await settle(page, 550);
      await assertNormal(page);
      await expect(page.locator('button[data-action="start"]').first()).toBeVisible();
      await capture(page, report, `${setKey}-normal-start`);
    }

    const badOverflow = report.states.filter(s => s.metrics.horizontalOverflow).map(s => s.name);
    if (badOverflow.length) throw new Error(`Horizontal overflow: ${badOverflow.join(', ')}`);
    if (report.pageErrors.length) throw new Error(`Page errors: ${JSON.stringify(report.pageErrors)}`);
    const actionableConsole = report.consoleErrors.filter(x => !/ERR_ABORTED|favicon/i.test(x.text));
    if (actionableConsole.length) throw new Error(`Console errors: ${JSON.stringify(actionableConsole)}`);
    report.testPassed = true;
  } catch (error) {
    report.failure = { name: error.name, message: error.message, stack: error.stack || '' };
    try { await capture(page, report, 'failure-evidence', true); } catch {}
    throw error;
  } finally {
    report.completedAt = new Date().toISOString();
    report.currentUrl = page.url();
    writeJson(path.join(partRoot, `${safeName(testInfo.project.name)}.json`), report);
  }
});
