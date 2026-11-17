import { defineConfig, devices } from '@playwright/test';

export default defineConfig ({
  testDir: './e2e',
  timeout: 30 * 1000,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['allure-playwright']
  ],
  use: {
    baseURL: 'http://195.63.138.24:5173/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    },
  ],
});
