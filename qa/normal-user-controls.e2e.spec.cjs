const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

async function expectActiveSet(page, setKey) {
  await expect(page.locator(`.set-option.active[data-set="${setKey}"]`)).toBeVisible();
}

test('normal paid-user auxiliary controls work without dev mode', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  const url = `${baseUrl}/exam.html?plan=three&set=set-01&fresh=1&qa-controls=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'manual')}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('.developer-entry-link')).toBeHidden();

  // Round selector buttons: exercise the real normal-user controls in both directions.
  await expectActiveSet(page, 'set-01');
  for (const setKey of ['set-02', 'set-03', 'set-01']) {
    const button = page.locator(`.set-option[data-set="${setKey}"]`);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();
    await expectActiveSet(page, setKey);
  }

  // Start, then exercise the real A+ control through all six font levels.
  await page.locator('button[data-action="start"]').first().click();
  await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('data-font-level', '1');

  const fontButton = page.locator('[data-action="increase-font"]');
  for (let level = 2; level <= 6; level += 1) {
    await expect(fontButton).toBeVisible();
    await fontButton.click();
    await expect(page.locator('#app')).toHaveAttribute('data-font-level', String(level));
  }
  await expect(fontButton).toBeDisabled();

  // Reset must return to a clean start screen and restore the default font level.
  const reset = page.locator('[data-action="reset-progress"]');
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(page.locator('button[data-action="start"]').first()).toBeVisible();
  await expect(page.locator('#app')).toHaveAttribute('data-font-level', '1');
  await expectActiveSet(page, 'set-01');
  await expect(page.locator('.developer-entry-link')).toBeHidden();

  // Verify that a fresh start still works after reset.
  await page.locator('button[data-action="start"]').first().click();
  await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
});
