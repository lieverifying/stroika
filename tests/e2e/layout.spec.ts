import { expect, test } from '@playwright/test';

// CLAUDE.md: «Ничего не уезжает вбок». Проверяем 320 / 375 / 768 / 1280 px.
const PAGES = ['/', '/styleguide', '/dyakuyemo'];
const WIDTHS = [320, 375, 768, 1280];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    test(`нет горизонтального скролла: ${path} @ ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
    });
  }
}

test('/styleguide открывается и закрыт от индексации', async ({ page }) => {
  const res = await page.goto('/styleguide');
  expect(res?.status()).toBe(200);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('h1')).toHaveText('Стайлгайд');
});
