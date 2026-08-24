const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

function makeResultUrl(plan = 'three') {
  return `${baseUrl}/exam.html?plan=${plan}&fresh=1&dev=1&start=1&module=reading&result=1&qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}`;
}

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
}

test('individual review never rewrites the displayed original score', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeResultUrl(), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.grade2-result-shell')).toBeVisible();
  await expect(page.locator('[data-attempt-history]')).toBeVisible();

  const readingTab = page.locator('[data-grade2-result-tab="reading"]');
  const originalScore = await readingTab.locator('strong').textContent();

  const card = page.locator('.grade2-result-review-card').first();
  await expect(card.locator('[data-inline-practice-open]')).toBeVisible();
  await card.locator('[data-inline-practice-open]').click();
  await expect(card.locator('[data-inline-practice-area]')).toBeVisible();
  await card.locator('[data-inline-choice="1"]').click();
  await card.locator('[data-inline-check]').click();
  await expect(card.locator('[data-inline-result]')).not.toHaveText('');

  await expect(readingTab.locator('strong')).toHaveText(originalScore || '0/31');
  await expect(page.locator('.grade2-result-shell')).toBeVisible();
});

test('listening replay stays in result review and does not enter editable listening mode', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeResultUrl(), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.grade2-result-shell')).toBeVisible();
  await page.locator('[data-grade2-result-tab="listening"]').click();
  await expect(page.locator('.grade2-result-choice-pane[aria-label="listening"]')).toBeVisible();

  const replay = page.locator('[data-grade2-listening-review]').first();
  await expect(replay).toBeVisible();
  const beforeUrl = page.url();
  await replay.click();
  await page.waitForTimeout(300);

  await expect(page.locator('.grade2-result-shell')).toBeVisible();
  expect(page.url()).toBe(beforeUrl);
  await expect(page.locator('.listen-frame')).toHaveCount(0);
});

test('skill retry entry points are present and Speaking remains premium', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeResultUrl(), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-skill-retry="reading"]')).toBeVisible();

  await page.locator('[data-grade2-result-tab="writing"]').click();
  await expect(page.locator('[data-skill-retry="writing"]')).toBeVisible();
  await expect(page.locator('[data-writing-practice-open]').first()).toBeVisible();

  await page.locator('[data-grade2-result-tab="speaking"]').click();
  await expect(page.locator('[data-skill-retry="speaking"]')).toBeVisible();
  await expect(page.locator('.grade2-retry-actions a[href*="bonus.html?plan=three"]')).toBeVisible();

  await page.locator('[data-grade2-result-tab="reading"]').click();
  await page.locator('[data-skill-retry="reading"]').click();
  await expect(page.locator('.reading-frame')).toBeVisible();
  await expect(page.locator('.grade2-result-shell')).toHaveCount(0);
});

test('completed result and history are restored after reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440x900', 'Reload persistence only needs one browser project.');
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeResultUrl(), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.grade2-result-shell')).toBeVisible();
  await expect(page.locator('[data-attempt-history]')).toBeVisible();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('.grade2-result-shell')).toBeVisible();
  await expect(page.locator('[data-attempt-history]')).toBeVisible();
});

test('1-pack keeps normal retry tools but does not expose premium Speaking retry or benefit button', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440x900', 'Plan gating only needs one browser project.');
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeResultUrl('single'), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-skill-retry="reading"]')).toBeVisible();
  await page.locator('[data-grade2-result-tab="writing"]').click();
  await expect(page.locator('[data-skill-retry="writing"]')).toBeVisible();
  await page.locator('[data-grade2-result-tab="speaking"]').click();
  await expect(page.locator('[data-skill-retry="speaking"]')).toHaveCount(0);
  await expect(page.locator('.grade2-retry-actions')).toContainText('3回プレミアム');
  await expect(page.locator('.grade2-retry-actions a[href*="bonus.html"]')).toHaveCount(0);
});

test('767 768 and 769px responsive boundary never creates horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440x900', 'Boundary sweep runs once to keep QA fast.');
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  for (const width of [767, 768, 769]) {
    await page.setViewportSize({ width, height: 1024 });
    await page.goto(`${baseUrl}/exam.html?plan=three&fresh=1&mode=normal&qa=boundary-${width}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#app')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.goto(makeResultUrl(), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.grade2-result-shell')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
