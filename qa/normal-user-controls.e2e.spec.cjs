const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

function startUrl(setKey = 'set-01') {
  return `${baseUrl}/exam.html?plan=three&set=${setKey}&fresh=1&qa-controls=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'manual')}`;
}

async function expectActiveSet(page, setKey) {
  await expect(page.locator(`.set-option.active[data-set="${setKey}"]`)).toBeVisible();
}

test('normal paid-user auxiliary controls work without dev mode', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  // Round selector buttons intentionally navigate straight into the selected
  // Grade 2 Speaking flow. Exercise each real button and verify both the URL
  // selection and the destination screen instead of expecting an in-place
  // active-class change.
  for (const setKey of ['set-01', 'set-02', 'set-03']) {
    await page.goto(startUrl('set-01'), { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('.developer-entry-link')).toBeHidden();
    await expectActiveSet(page, 'set-01');

    const button = page.locator(`.set-option[data-set="${setKey}"]`);
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
    await button.click();

    await page.waitForURL((url) => url.searchParams.get('set') === setKey && url.searchParams.get('module') === 'speaking' && url.searchParams.get('start') === '1');
    await expect(page.locator('.grade2-speaking-flow')).toBeVisible();
    await expect(page.locator('.developer-entry-link')).toBeHidden();
  }

  // Return to a clean Set 01 start screen, then exercise the real A+ control
  // through all six font levels.
  await page.goto(startUrl('set-01'), { waitUntil: 'domcontentloaded' });
  await expectActiveSet(page, 'set-01');
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
