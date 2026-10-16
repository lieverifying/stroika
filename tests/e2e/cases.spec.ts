import { expect, test } from '@playwright/test';

// Карточки кейсов на главной (блок 3)
test.describe('карточки кейсов', () => {
  test('вся карточка кликабельна: нажатие по обложке ведёт на страницу кейса', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.case-card').first();
    await card.scrollIntoViewIfNeeded();
    const href = await card.locator('a').getAttribute('href');
    expect(href).toMatch(/^\/roboty\/[a-z0-9-]+$/);
    const box = (await card.locator('.case-card__media').boundingBox())!;
    const target = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href') ?? null,
      { x: box.x + box.width / 2, y: box.y + box.height / 2 },
    );
    expect(target).toBe(href);
  });

  test('фокус с клавиатуры виден на карточке', async ({ page }) => {
    await page.goto('/');
    await page.locator('.case-card a').first().focus();
    await expect(page.locator('.case-card').first()).toHaveCSS('outline-style', 'solid');
  });

  test('на главной 6–8 кейсов', async ({ page }) => {
    await page.goto('/');
    const n = await page.locator('[data-block="3"] .case-card').count();
    expect(n).toBeGreaterThanOrEqual(6);
    expect(n).toBeLessThanOrEqual(8);
  });
});
