const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

function isSameOriginNavigableHref(href) {
  return Boolean(href) && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !/^https?:\/\//i.test(href);
}

test('landing page lightweight asset, layout, and public-entry QA', async ({ page, request }) => {
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

  const paidExamLinks = page.locator('a[href*="exam.html?plan=single"], a[href*="exam.html?plan=three"]');
  expect(await paidExamLinks.count(), 'Public LP must not expose paid exam entry links while sales are closed.').toBe(0);
  expect(await page.locator('.developer-entry-link').count(), 'Public LP must not expose developer links.').toBe(0);

  const disabledPaidCtas = page.locator('#pricing .pricing-grid .disabled-button');
  expect(await disabledPaidCtas.count()).toBe(2);
  await expect(disabledPaidCtas.nth(0)).toHaveText('販売準備中');
  await expect(disabledPaidCtas.nth(1)).toHaveText('販売準備中');

  const sampleLinks = page.locator('a[href*="exam.html?plan=sample"]');
  expect(await sampleLinks.count()).toBeGreaterThanOrEqual(3);
  const sampleHrefs = await sampleLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href') || ''));
  expect(sampleHrefs.every((href) => /plan=sample/.test(href) && /demo=1/.test(href) && /fresh=1/.test(href))).toBe(true);

  const manifestResponse = await request.get(`${baseUrl}/manifest.webmanifest?qa=${Date.now()}`);
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe('/exam.html?plan=sample&demo=1&fresh=1');

  const hashTargets = await page.locator('a[href^="#"]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')).filter(Boolean)
  );
  const missingHashTargets = await page.evaluate((hrefs) =>
    hrefs.filter((href) => href !== '#' && !document.querySelector(href))
  , hashTargets);
  expect(missingHashTargets, `Broken in-page LP anchors: ${JSON.stringify(missingHashTargets)}`).toEqual([]);

  const sameOriginHrefs = await page.locator('a[href]').evaluateAll((links) =>
    [...new Set(links.map((link) => link.getAttribute('href') || '').filter(Boolean))]
  );
  const linkFailures = [];
  for (const href of sameOriginHrefs.filter(isSameOriginNavigableHref)) {
    const url = new URL(href, `${baseUrl}/`).href;
    const response = await request.get(url, { maxRedirects: 0 });
    if (response.status() >= 400) linkFailures.push({ href, status: response.status() });
  }
  expect(linkFailures, `Broken same-origin LP links: ${JSON.stringify(linkFailures)}`).toEqual([]);

  const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(layout.scrollWidth, `Landing page horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(httpErrors, `HTTP 4xx/5xx responses: ${JSON.stringify(httpErrors)}`).toEqual([]);
  expect(pageErrors, `Landing page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
  expect(consoleErrors, `Landing page console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
});

test('free sample CTA opens only the sample experience', async ({ page }) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });
  const sampleCta = page.getByRole('link', { name: '無料サンプルを試す' });
  await expect(sampleCta).toBeVisible();
  await sampleCta.click();
  await expect(page).toHaveURL(/\/exam\.html\?.*plan=sample/);
  expect(new URL(page.url()).searchParams.get('plan')).toBe('sample');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('button[data-action="start"]').first()).toBeVisible();
});
