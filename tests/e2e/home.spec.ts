import { expect, test } from '@playwright/test';

// Главная: порядок блоков = ТЗ (0 — шапка, 1–13 — main, 14 — футер), якоря не прячутся под шапкой
test.describe('главная', () => {
  test('блоки 1–14 идут строго по порядку ТЗ', async ({ page }) => {
    await page.goto('/');
    const order = await page.locator('[data-block]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-block'))));
    expect(order).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    await expect(page.locator('h1')).toHaveCount(1);
  });

  for (const anchor of ['kvyz', 'zamir']) {
    test(`якорь #${anchor}: заголовок блока виден под шапкой`, async ({ page }) => {
      await page.goto(`/#${anchor}`);
      await page.waitForTimeout(300);
      const headerBottom = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().bottom);
      const titleTop = await page.locator(`#${anchor} h2`).evaluate((el) => el.getBoundingClientRect().top);
      expect(titleTop).toBeGreaterThanOrEqual(headerBottom);
    });
  }
});
