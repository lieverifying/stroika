import { expect, test } from '@playwright/test';

// Блок 1 посадочной — правки владельца по ревью фазы 2, скриншотам фазы 3 и ТЗ v2 (фото 4:3 на телефоне)
test.describe('первый экран', () => {
  test('телефон: фото первым над H1, 4:3, во всю ширину; заявка доступна из нижней панели', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    const media = (await page.locator('.hero__media').boundingBox())!;
    const h1 = (await page.locator('h1').boundingBox())!;
    expect(media.y + media.height).toBeLessThanOrEqual(h1.y);
    expect(media.width).toBe(375);
    expect(media.width / media.height).toBeCloseTo(4 / 3, 1);
    // Кнопки hero могут уйти ниже первого экрана — «Порахувати» в панели видна всегда
    await expect(page.locator('[data-bottom-bar] [data-cta]')).toBeInViewport();
  });

  test('десктоп: текст по центру фото по вертикали, фото под шапкой и целиком в первом экране', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/kukhni');
    const text = (await page.locator('.hero__text').boundingBox())!;
    const media = (await page.locator('.hero__media').boundingBox())!;
    const header = (await page.locator('[data-header]').boundingBox())!;
    expect(Math.abs(text.y + text.height / 2 - (media.y + media.height / 2))).toBeLessThanOrEqual(1);
    expect(media.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(media.y + media.height).toBeLessThanOrEqual(800);
  });

  test('H1 — Unbounded 500', async ({ page }) => {
    await page.goto('/kukhni');
    await expect(page.locator('h1')).toHaveCSS('font-weight', '500');
  });

  test('фото — настоящая работа из портфолио (facts.media.hero), с alt, грузится сразу', async ({ page }) => {
    await page.goto('/kukhni');
    const img = page.locator('.hero__media img');
    await expect(img).toHaveAttribute('src', /\/portfolio\/img\/kukhni\/kukhnia-06\.webp$/);
    await expect(img).toHaveAttribute('alt', /.+/);
    await expect(img).toHaveAttribute('fetchpriority', 'high');
    await expect(img).not.toHaveAttribute('loading', 'lazy');
    await expect(page.locator('.hero__media .ph')).toHaveCount(0);
    expect(await img.evaluate((e: HTMLImageElement) => e.complete && e.naturalWidth > 0)).toBe(true);
  });
});
