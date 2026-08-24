const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

test('landing page lightweight asset and layout QA', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

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

  await page.goto(`${baseUrl}/?qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#top')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'S-CBTは、英語力だけでは勝負できません。' })).toBeAttached();

  await page.evaluate(() => {
    for (const image of document.querySelectorAll('img[src]')) image.loading = 'eager';
  });

  const assetResults = await page.evaluate(async () => {
    const urls = new Set();
    for (const image of document.querySelectorAll('img[src]')) urls.add(new URL(image.getAttribute('src'), document.baseURI).href);
    for (const icon of document.querySelectorAll('.mini-illustration, .showcase-icon')) {
      const background = getComputedStyle(icon).backgroundImage;
      const match = background.match(/url\(["']?(.*?)["']?\)/);
      if (match?.[1]) urls.add(new URL(match[1], document.baseURI).href);
    }
    return Promise.all([...urls].map(async (assetUrl) => {
      try {
        const response = await fetch(assetUrl, { cache: 'no-store' });
        return { url: assetUrl, status: response.status, ok: response.ok, contentType: response.headers.get('content-type') || '' };
      } catch (error) {
        return { url: assetUrl, status: 0, ok: false, contentType: '', error: String(error) };
      }
    }));
  });

  const badAssets = assetResults.filter((item) => !item.ok || !/^image\//i.test(item.contentType));
  expect(badAssets, `Landing page asset failures: ${JSON.stringify(badAssets)}`).toEqual([]);

  const miniIcons = page.locator('.mini-illustration');
  const showcaseIcons = page.locator('.showcase-icon');
  expect(await miniIcons.count()).toBeGreaterThanOrEqual(2);
  expect(await showcaseIcons.count()).toBe(4);

  const spriteChecks = await page.locator('.mini-illustration, .showcase-icon').evaluateAll((elements) =>
    elements.map((element) => ({
      backgroundImage: getComputedStyle(element).backgroundImage,
      backgroundPosition: getComputedStyle(element).backgroundPosition,
    }))
  );
  expect(spriteChecks.every((item) => item.backgroundImage && item.backgroundImage !== 'none')).toBe(true);
  expect(new Set(spriteChecks.map((item) => item.backgroundPosition)).size).toBeGreaterThanOrEqual(4);

  const brokenVisibleImages = await page.locator('img[src]').evaluateAll((items) =>
    items.filter((image) => {
      const style = getComputedStyle(image);
      const visible = style.display !== 'none' && style.visibility !== 'hidden' && image.getClientRects().length > 0;
      return visible && (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0);
    }).map((image) => image.currentSrc || image.src)
  );
  expect(brokenVisibleImages, `Broken visible landing images: ${JSON.stringify(brokenVisibleImages)}`).toEqual([]);

  const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(layout.scrollWidth, `Landing page horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(httpErrors, `HTTP 4xx/5xx responses: ${JSON.stringify(httpErrors)}`).toEqual([]);
  expect(pageErrors, `Landing page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
  expect(consoleErrors, `Landing page console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
});
