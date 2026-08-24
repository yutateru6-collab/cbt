const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || 'https://cbt.itisnowornever271.workers.dev').replace(/\/$/, '');
const expectedSha = String(process.env.QA_EXPECTED_SHA || '').trim();

test('deployed production opens, navigates, and serves real Listening audio', async ({ page, request }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error' && !/ERR_ABORTED/i.test(message.text())) consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url(), resourceType: response.request().resourceType() });
  });

  const buildResponse = await request.get(`${baseUrl}/build-info.json?production-smoke=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache' },
  });
  expect(buildResponse.status()).toBe(200);
  const buildInfo = await buildResponse.json();
  if (expectedSha) expect(buildInfo.commit).toBe(expectedSha);
  expect(buildInfo.environment).toBe('production');

  await page.goto(`${baseUrl}/exam.html?plan=three&fresh=1&mode=normal&production-smoke=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible();
  const start = page.locator('button[data-action="start"]').first();
  await expect(start).toBeVisible();
  await start.click();
  await expect(page.locator('.grade2-speaking-flow')).toBeVisible();

  await page.goto(`${baseUrl}/exam.html?plan=three&fresh=1&dev=1&start=1&module=reading&question=1&production-smoke=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.reading-frame')).toBeVisible();
  await expect(page.locator('[data-progress-review-open="reading"]')).toBeVisible();
  const readingOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(readingOverflow).toBe(false);

  await page.goto(`${baseUrl}/exam.html?plan=three&fresh=1&dev=1&start=1&module=listening&question=1&production-smoke=1`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.listen-frame')).toBeVisible();
  await expect(page.locator('[data-progress-review-open="listening"]')).toBeVisible();

  const audioPath = await page.evaluate(() => {
    const question = listeningQuestions?.[appState.listeningIndex];
    return String(question?.audioFile || '');
  });
  expect(audioPath, 'Production Listening question should expose a real audio URL.').not.toBe('');
  const audioUrl = new URL(audioPath, page.url()).href;
  const audioResponse = await request.get(audioUrl, { headers: { Range: 'bytes=0-4095', 'Cache-Control': 'no-cache' } });
  expect([200, 206]).toContain(audioResponse.status());
  expect(String(audioResponse.headers()['content-type'] || '')).toMatch(/^audio\//i);
  const audioBody = await audioResponse.body();
  expect(audioBody.length).toBeGreaterThan(44);

  const listeningOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(listeningOverflow).toBe(false);
  expect(httpErrors, `Production HTTP 4xx/5xx responses: ${JSON.stringify(httpErrors)}`).toEqual([]);
  expect(pageErrors, `Production page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
  expect(consoleErrors, `Production console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
});
