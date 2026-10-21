import { expect, test } from '@playwright/test';

test.describe('нижняя панель', () => {
  test('телефон: видна, кнопки ≥ 48 px, конец страницы не перекрыт', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    const bar = page.locator('[data-bottom-bar]');
    await expect(bar).toBeVisible();

    const heights = await bar.locator('a').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(heights).toHaveLength(3);
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(48);

    // Прокручиваем в самый низ: последний элемент main должен быть выше панели
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const lastBottom = await page.locator('main > *').last().evaluate((el) => el.getBoundingClientRect().bottom);
    const barTop = await bar.evaluate((el) => el.getBoundingClientRect().top);
    expect(lastBottom).toBeLessThanOrEqual(barTop + 1); // допуск на субпиксели
  });

  test('телефон: прячется при фокусе в поле ввода', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'test-field';
      document.querySelector('main')?.append(input);
    });
    const bar = page.locator('[data-bottom-bar]');
    await page.focus('#test-field');
    await expect(bar).toHaveAttribute('data-hidden', '');
    await page.locator('#test-field').blur();
    await expect(bar).not.toHaveAttribute('data-hidden', '');
  });

  test('десктоп: панели нет', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/kukhni');
    await expect(page.locator('[data-bottom-bar]')).toBeHidden();
  });
});
