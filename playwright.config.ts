import { defineConfig, devices } from '@playwright/test';

// E2E всегда против свежей production-сборки: webServer сначала делает `astro build`, потом поднимает preview.
// Свой порт 4398 и reuseExistingServer: false — тесты не попадут на dev-сервер (4321) или старый dist.
// Ширины — из CLAUDE.md: 375 и 1280 px.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4398',
    locale: 'uk-UA',
  },
  projects: [
    {
      name: 'mobile-375',
      use: {
        ...devices['iPhone 13'],
        browserName: 'chromium',
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: 'desktop-1280',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'npx astro build && npx astro preview --port 4398 --ignore-lock',
    url: 'http://localhost:4398',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
