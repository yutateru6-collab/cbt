const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

function makeReadingUrl() {
  return `${baseUrl}/exam.html?plan=three&fresh=1&dev=1&start=1&module=reading&question=1&qa=progress-review`;
}

test('progress review is read-only, hides future questions, and resumes at the same position', async ({ page }, testInfo) => {
  test.skip(!['desktop-1440x900', 'iphone-16-393x852'].includes(testInfo.project.name), 'Progress-review modal is checked on desktop and iPhone-size WebKit only.');
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeReadingUrl(), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.reading-frame')).toBeVisible();
  const reviewButton = page.locator('[data-progress-review-open="reading"]').first();
  await expect(reviewButton).toBeVisible();

  const firstChoice = page.locator('[data-action="written-answer"]').first();
  await expect(firstChoice).toBeVisible();
  await firstChoice.click();
  const stateBefore = await page.evaluate(() => JSON.stringify(appState.answers.written));

  await reviewButton.click();
  const modal = page.locator('[data-progress-review-modal="reading"]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('[data-progress-review-question="1"]')).toBeVisible();
  await expect(modal.locator('[data-progress-review-question="18"]')).toHaveCount(0);
  await expect(modal).toContainText('この確認画面では回答データを書き換えません');

  await modal.locator('[data-progress-review-close]').last().click();
  await expect(modal).toHaveCount(0);
  await expect(page.locator('.reading-frame')).toBeVisible();
  const stateAfter = await page.evaluate(() => JSON.stringify(appState.answers.written));
  expect(stateAfter).toBe(stateBefore);
});

test('Reading skill break offers completed-skill review and returns to the break before Writing', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1440x900', 'Skill-break navigation only needs one browser project.');
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(makeReadingUrl(), { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.reading-frame')).toBeVisible();

  let reachedLast = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const next = page.locator('.nav-button.next[data-action="reading-next"]');
    await expect(next).toBeVisible();
    const label = String(await next.textContent() || '');
    if (label.includes('ライティングへ')) {
      await next.click();
      reachedLast = true;
      break;
    }
    await next.click();
    await expect(page.locator('.reading-frame')).toBeVisible();
  }
  expect(reachedLast, 'Reading should reach the real final navigation button.').toBe(true);

  const skillBreak = page.locator('[data-skill-break]');
  await expect(skillBreak).toBeVisible();
  const reviewButton = skillBreak.locator('[data-progress-review-open="reading"][data-progress-review-completed="1"]');
  await expect(reviewButton).toBeVisible();
  await reviewButton.click();

  const modal = page.locator('[data-progress-review-modal="reading"]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('[data-progress-review-question="31"]')).toBeVisible();
  await modal.locator('[data-progress-review-close]').last().click();

  await expect(skillBreak).toBeVisible();
  await skillBreak.locator('[data-skill-break-continue]').click();
  await expect(page.locator('textarea.writing-textarea').first()).toBeVisible();
});
