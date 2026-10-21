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

test('режим запуска: блоки 2, 4, 9, 10, 11 без фактов скрыты, пустых плашек нет', async ({ page }) => {
  await page.goto('/');
  for (const n of [2, 4, 9, 10, 11]) await expect(page.locator(`[data-block="${n}"]`)).toHaveCount(0);
  await expect(page.locator('.fact-ph')).toHaveCount(0);
});

test('блок 12: 6 вопросов (без фактов вопросы о гарантии, оплате, материалах скрыты), аккордеон открывается мышью и клавиатурой, работает без JS', async ({ page, browser }) => {
  await page.goto('/');
  const items = page.locator('[data-block="12"] details');
  await expect(items).toHaveCount(6);
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
