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

test.describe('фильтр портфолио', () => {
  test('«Кутова» оставляет только кутові, «Усі» возвращает все', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#portfolio-grid > li');
    const total = await cards.count();
    const kutova = page.getByRole('group', { name: 'Форма кухні' }).getByRole('button', { name: 'Кутова' });
    await kutova.click();
    await expect(kutova).toHaveAttribute('aria-pressed', 'true');
    const visible = page.locator('#portfolio-grid > li:visible');
    await expect(visible).toHaveCount(2);
    expect(await visible.evaluateAll((els) => els.every((e) => e.getAttribute('data-shape') === 'kutova'))).toBe(true);
    await page.getByRole('button', { name: 'Усі' }).click();
    await expect(visible).toHaveCount(total);
  });

  test('без JS фильтр скрыт, видны все карточки', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/');
    await expect(page.locator('[data-case-filter]')).toBeHidden();
    await expect(page.locator('#portfolio-grid > li:visible')).toHaveCount(8);
    await ctx.close();
  });

  test('телефон: лента чипов скроллится сама, страница вбок не едет', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    const track = page.locator('.case-filter__track');
    const { sw, cw } = await track.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
    expect(sw).toBeGreaterThan(cw);
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow).toBeLessThanOrEqual(0);
  });
});
