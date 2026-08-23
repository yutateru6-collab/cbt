const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const outputRoot = path.resolve(process.cwd(), 'qa-output');
const screenshotRoot = path.join(outputRoot, 'screenshots');
const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');

function ensureOutput() {
  fs.mkdirSync(screenshotRoot, { recursive: true });
}

async function captureViewport(page, project, state, options = {}) {
  const prefix = `${project}-${state}`;
  await page.screenshot({
    path: path.join(screenshotRoot, `${prefix}-viewport.png`),
    type: 'png',
    fullPage: false,
    scale: 'device',
    animations: 'disabled',
  });
  await page.screenshot({
    path: path.join(screenshotRoot, `${prefix}-ai-preview.jpg`),
    type: 'jpeg',
    quality: 55,
    fullPage: false,
    scale: 'css',
    animations: 'disabled',
  });
  if (options.fullPage) {
    await page.screenshot({
      path: path.join(screenshotRoot, `${prefix}-full.png`),
      type: 'png',
      fullPage: true,
      scale: 'device',
      animations: 'disabled',
    });
  }
}

async function captureDetail(locator, project, state) {
  await expect(locator).toBeVisible();
  await locator.screenshot({
    path: path.join(screenshotRoot, `${project}-${state}-detail-crop.jpg`),
    type: 'jpeg',
    quality: 72,
    scale: 'device',
    animations: 'disabled',
  });
}

ensureOutput();

test('landing page images and sprite icons render without missing assets', async ({ page }, testInfo) => {
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !/ERR_ABORTED/i.test(message.text())) consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));

  const url = `${baseUrl}/?qa=${encodeURIComponent(process.env.QA_EXPECTED_SHA || 'local')}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#top')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'S-CBTは、英語力だけでは勝負できません。' })).toBeAttached();

  await captureViewport(page, testInfo.project.name, 'lp-top', { fullPage: true });

  const assetResults = await page.evaluate(async () => {
    const urls = new Set();
    for (const image of document.querySelectorAll('img[src]')) {
      urls.add(new URL(image.getAttribute('src'), document.baseURI).href);
    }
    for (const icon of document.querySelectorAll('.mini-illustration, .showcase-icon')) {
      const background = getComputedStyle(icon).backgroundImage;
      const match = background.match(/url\(["']?(.*?)["']?\)/);
      if (match?.[1]) urls.add(new URL(match[1], document.baseURI).href);
    }

    return Promise.all([...urls].map(async (assetUrl) => {
      try {
        const response = await fetch(assetUrl, { cache: 'no-store' });
        return {
          url: assetUrl,
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type') || '',
        };
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
      className: element.className,
      backgroundImage: getComputedStyle(element).backgroundImage,
      backgroundPosition: getComputedStyle(element).backgroundPosition,
    }))
  );
  expect(spriteChecks.every((item) => item.backgroundImage && item.backgroundImage !== 'none')).toBe(true);
  expect(new Set(spriteChecks.map((item) => item.backgroundPosition)).size).toBeGreaterThanOrEqual(4);

  const problemHeading = page.locator('#problem .section-heading.has-illustration');
  await problemHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await captureViewport(page, testInfo.project.name, 'lp-problem-icons');
  await captureDetail(problemHeading, testInfo.project.name, 'lp-problem-icons');

  const showcase = page.locator('.showcase-grid');
  await showcase.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await captureViewport(page, testInfo.project.name, 'lp-showcase-icons');
  await captureDetail(showcase, testInfo.project.name, 'lp-showcase-icons');

  const pricingHeading = page.locator('#pricing .section-heading.has-illustration');
  await pricingHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await captureViewport(page, testInfo.project.name, 'lp-pricing-icon');
  await captureDetail(pricingHeading, testInfo.project.name, 'lp-pricing-icon');

  const images = page.locator('img[src]');
  for (let index = 0; index < await images.count(); index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded();
  }
  await page.waitForTimeout(700);
  const brokenImages = await images.evaluateAll((items) =>
    items
      .filter((image) => !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0)
      .map((image) => image.currentSrc || image.src)
  );
  expect(brokenImages, `Broken landing page <img> elements: ${JSON.stringify(brokenImages)}`).toEqual([]);

  const layout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(layout.scrollWidth, `Landing page horizontal overflow: ${JSON.stringify(layout)}`).toBeLessThanOrEqual(layout.clientWidth + 1);
  expect(pageErrors, `Landing page errors: ${JSON.stringify(pageErrors)}`).toEqual([]);
  expect(consoleErrors, `Landing page console errors: ${JSON.stringify(consoleErrors)}`).toEqual([]);
});
