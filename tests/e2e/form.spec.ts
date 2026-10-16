import { expect, test } from '@playwright/test';

// Поля формы замера (блок 13)
test.describe('поля формы', () => {
  test('маска телефона: 0671234567 → +380 67 123 45 67', async ({ page }) => {
    await page.goto('/');
    const phone = page.locator('#zamir-phone');
    await phone.click();
    await expect(phone).toHaveValue('+380 ');
    await phone.pressSequentially('0671234567');
    await expect(phone).toHaveValue('+380 67 123 45 67');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
  });

  test('поля 48 px и шрифт 16 px (iOS не зумит), согласие не отмечено', async ({ page }) => {
    await page.goto('/');
    for (const sel of ['#zamir-name', '#zamir-phone', '#zamir-time']) {
      const f = page.locator(sel);
      await expect(f).toHaveCSS('font-size', '16px');
      expect((await f.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator('#zamir-consent')).not.toBeChecked();
  });

  test('поле-ловушка не попадает в порядок Tab и скрыто от скринридера', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#zamir-website')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('.hp').first()).toHaveAttribute('aria-hidden', 'true');
  });
});
