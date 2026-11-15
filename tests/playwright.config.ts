import { defineConfig, devices } from '@playwright/test';

export default defineConfig ({
  testDir: './e2e',
  timeout: 30 * 1000,
  retries: 1,
  reporter: [
    ['html'],
    // Allure-результаты для публикации на GitHub Pages (см. .github/workflows/ci.yml).
    // Папка по умолчанию (allure-results) — та же, куда пишет jest-allure2-reporter,
    // чтобы генератор собирал единый отчёт из обоих прогонов.
    ['allure-playwright'],
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
