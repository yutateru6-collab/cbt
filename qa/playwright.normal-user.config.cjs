const path = require('node:path');
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: 'normal-user-flow.e2e.spec.cjs',
  outputDir: path.resolve(process.cwd(), 'qa-normal-output', 'test-results'),
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['line'],
    ['html', { outputFolder: path.resolve(process.cwd(), 'qa-normal-output', 'playwright-report'), open: 'never' }],
  ],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    ignoreHTTPSErrors: false,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    colorScheme: 'light',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'off',
    video: 'off',
  },
  projects: [
    {
      name: 'desktop-1440x900',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
        screen: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      },
    },
    {
      name: 'iphone-16-393x852',
      use: {
        browserName: 'webkit',
        viewport: { width: 393, height: 852 },
        screen: { width: 393, height: 852 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
      },
    },
  ],
});
