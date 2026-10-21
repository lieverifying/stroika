import { expect, test } from './fixtures';

// Посадочные: блоков без фактов нет, никаких выдуманных цен, брендов, отзывов и условий

test('посадочная: блоков 2, 4, 6–11 нет, пустых плашек нет', async ({ page }) => {
  await page.goto('/kukhni');
  for (const n of [2, 4, 6, 7, 8, 9, 10, 11]) await expect(page.locator(`[data-block="${n}"]`)).toHaveCount(0);
  await expect(page.locator('.fact-ph')).toHaveCount(0);
});

test('блок 12 на /kukhni: 5 вопросов, аккордеон открывается мышью и клавиатурой, работает без JS', async ({ page, browser }) => {
  await page.goto('/kukhni');
  const items = page.locator('[data-block="12"] details');
  await expect(items).toHaveCount(5);
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
  await noJs.goto('/kukhni');
  const d = noJs.locator('[data-block="12"] details').nth(1);
  await d.locator('summary').click();
  await expect(d).toHaveAttribute('open', '');
  await ctx.close();
});
