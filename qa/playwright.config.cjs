const path = require('node:path');
const { defineConfig } = require('@playwright/test');
const { projects } = require('./device-matrix.cjs');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['cbt-light.e2e.spec.cjs', 'grade2-speaking-flow.e2e.spec.cjs', 'lp-light.e2e.spec.cjs', 'lp-service-worker.e2e.spec.cjs', 'review-retry.e2e.spec.cjs', 'progress-review.e2e.spec.cjs'],
  outputDir: path.resolve(process.cwd(), 'qa-output', 'screenshots'),
  timeout: 120_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['line'],
    ['html', { outputFolder: path.resolve(process.cwd(), 'qa-output', 'playwright-report'), open: 'never' }],
  ],
  use: {
    baseURL: process.env.QA_BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
    ignoreHTTPSErrors: false,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    colorScheme: 'light',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects,
});
