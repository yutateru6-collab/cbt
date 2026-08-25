const { test, expect } = require('@playwright/test');

const baseUrl = String(process.env.QA_BASE_URL || '').replace(/\/$/, '');
const checkedProjects = new Set(['desktop-1440x900', 'iphone-16-393x852']);

test.use({ serviceWorkers: 'allow' });

test('LP and exam use one shared service worker registration', async ({ page }, testInfo) => {
  test.skip(!checkedProjects.has(testInfo.project.name), 'Service-worker handoff is checked on representative desktop and iPhone layouts.');
  if (!baseUrl) throw new Error('QA_BASE_URL is required.');

  await page.goto(`${baseUrl}/?sw-qa=${Date.now()}`, { waitUntil: 'load' });
  const lpRegistration = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return null;
    const registration = await navigator.serviceWorker.ready;
    return registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || '';
  });
  expect(lpRegistration).toContain('/sw.js');
  expect(lpRegistration).not.toContain('sw-set02-v2.js');

  await page.goto(`${baseUrl}/exam.html?plan=sample&demo=1&fresh=1&sw-qa=${Date.now()}`, { waitUntil: 'load' });
  await expect(page.locator('#app')).toBeVisible();
  const examRegistrations = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return [];
    await navigator.serviceWorker.ready;
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map((registration) =>
      registration.active?.scriptURL || registration.waiting?.scriptURL || registration.installing?.scriptURL || ''
    );
  });

  expect(examRegistrations.length).toBe(1);
  expect(examRegistrations[0]).toContain('/sw.js');
  expect(examRegistrations[0]).not.toContain('sw-set02-v2.js');
});
