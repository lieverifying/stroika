import { expect, test } from '@playwright/test';

// Блок 1 — правки по ревью дизайна фазы 2
test.describe('первый экран', () => {
  test('десктоп: верх фото на уровне верха H1, фото целиком в первом экране', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/');
    const h1 = await page.locator('h1').boundingBox();
    const media = await page.locator('.hero__media').boundingBox();
    expect(h1 && media).toBeTruthy();
    expect(Math.abs(h1!.y - media!.y)).toBeLessThanOrEqual(1);
    expect(media!.y + media!.height).toBeLessThanOrEqual(800);
  });

  test('H1 — Unbounded 500', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCSS('font-weight', '500');
  });

  test('плейсхолдер фото скрыт от скринридера', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.ph').first()).toHaveAttribute('aria-hidden', 'true');
  });
});
