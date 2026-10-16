import { expect, test } from '@playwright/test';

// Блоки 8–11: только заглушки, никаких выдуманных цен, брендов, отзывов и условий
test.describe('блоки 8–11', () => {
  test('блок 8: 4 цены — заглушки, подпись «після заміру», одна кнопка заявки', async ({ page }) => {
    await page.goto('/');
    const block = page.locator('[data-block="8"]');
    await expect(block.locator('.prices__card')).toHaveCount(4);
    await expect(block.locator('.prices__card .fact-ph')).toHaveCount(4);
    await expect(block).toContainText('після заміру');
    await expect(block.locator('[data-cta="primary"]')).toHaveCount(1);
  });
});
