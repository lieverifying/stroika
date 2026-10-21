import { expect, test } from '@playwright/test';

// Блоки 8–11: никаких выдуманных цен, брендов, отзывов и условий
test.describe('блоки 8–11', () => {
  test('блок 8 «Скільки коштує»: без цен и сроков — от чего зависит цена, одна кнопка заявки', async ({ page }) => {
    await page.goto('/');
    const block = page.locator('[data-block="8"]');
    await expect(block.locator('h2')).toHaveText('Скільки коштує');
    await expect(block).toContainText('Ціну й терміни розрахуємо під ваше завдання');
    await expect(block.locator('.prices__name')).toHaveText(['Розміри', 'Матеріали', 'Наповнення']);
    await expect(block).not.toContainText('грн');
    await expect(block.locator('.fact-ph')).toHaveCount(0);
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

test('блок 11: гарантия и оплата — только заглушки, остаток не выдуман', async ({ page }) => {
  await page.goto('/');
  const block = page.locator('[data-block="11"]');
  for (const name of ['WARRANTY_YEARS', 'WARRANTY_TERMS', 'PAYMENT_PREPAY_PERCENT', 'PAYMENT_SCHEDULE', 'PAYMENT_METHODS']) {
    await expect(block.locator(`[data-placeholder="${name}"]`)).toHaveCount(1);
  }
  // пока передоплата — заглушка, строки «Решта» нет
  await expect(block.getByText('Решта')).toHaveCount(0);
});

test('телефон: логотипы по 3 в ряд не выше 48 px', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'только телефон');
  await page.goto('/');
  const logos = page.locator('[data-block="9"] .materials__logos').first().locator('li');
  const boxes = await logos.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ top: Math.round(r.top), h: r.height })));
  expect(boxes.filter((b) => b.top === boxes[0].top)).toHaveLength(3);
  for (const b of boxes) expect(b.h).toBeLessThanOrEqual(48);
});

test('блок 12: 9 вопросов (рекомендации — за выключенным флагом), аккордеон открывается мышью и клавиатурой, работает без JS', async ({ page, browser }) => {
  await page.goto('/');
  const items = page.locator('[data-block="12"] details');
  await expect(items).toHaveCount(9);
  await expect(page.locator('[data-block="12"]')).not.toContainText('порекомендувати');
  const first = items.first();
  const summary = first.locator('summary');
  expect((await summary.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await summary.click();
  await expect(first).toHaveAttribute('open', '');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(first).not.toHaveAttribute('open', '');

  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await ctx.newPage();
  await noJs.goto('/');
  const d = noJs.locator('[data-block="12"] details').nth(1);
  await d.locator('summary').click();
  await expect(d).toHaveAttribute('open', '');
  await ctx.close();
});
