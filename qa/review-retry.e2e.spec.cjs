const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

function makeResultUrl() {
  return `${baseUrl}/exam.html?plan=three&fresh=1&dev=1&start=1&module=reading&result=1&qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}`;
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
