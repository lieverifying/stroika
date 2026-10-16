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

test('блок 9: бренды — только заглушки, места под логотипы скрыты от скринридера', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('[data-block="9"]');
  await expect(block.locator('[data-placeholder="HARDWARE_BRANDS"]')).toHaveCount(1);
  await expect(block.locator('[data-placeholder="MATERIAL_BRANDS"]')).toHaveCount(1);
  await expect(block.locator('img')).toHaveCount(0);
  for (const list of await block.locator('.materials__logos').all()) await expect(list).toHaveAttribute('aria-hidden', 'true');
});

test('блок 10: отзывы и рейтинг — только заглушки, ссылка на Google во внешней вкладке', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('[data-block="10"]');
  await expect(block.locator('.reviews__card')).toHaveCount(3);
  for (const n of [1, 2, 3]) await expect(block.locator(`[data-placeholder="REVIEW_${n}_TEXT"]`)).toHaveCount(1);
  await expect(block.locator('[data-placeholder="GOOGLE_RATING"]')).toHaveCount(1);
  const link = block.getByRole('link', { name: 'Всі відгуки в Google' });
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
});
