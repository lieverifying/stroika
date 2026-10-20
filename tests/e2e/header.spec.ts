import { expect, test } from '@playwright/test';

test.describe('шапка', () => {
  test('телефон: бургер открывает и закрывает меню мышью и клавиатурой', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/');
    const toggle = page.locator('[data-menu-toggle]');
    const menu = page.locator('#mobile-menu');

    await expect(menu).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(toggle).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Enter'); // фокус на первом пункте — переход закрывает меню
    await expect(menu).toBeHidden();
  });

  test('телефон: при открытом меню Tab не уходит на страницу под ним', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/');
    await page.locator('[data-menu-toggle]').click();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      // body — переход фокуса на интерфейс браузера после последнего пункта, это нормально
      const ok = await page.evaluate(
        () => document.activeElement === document.body || !!document.activeElement?.closest('[data-header]'),
      );
      expect(ok).toBe(true);
    }
  });

  test('десктоп: меню в одну строку, бургера нет', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/');
    await expect(page.locator('[data-menu-toggle]')).toBeHidden();
    const items = page.getByRole('navigation', { name: 'Головне меню' }).getByRole('link');
    await expect(items).toHaveText(['Кухні', 'Меблі', 'Роботи', 'Як ми створюємо', 'Контакти']); // «Ремонт» убран (2026-10-20)
    const tops = await items.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });

  test('шапка остаётся вверху при прокрутке', async ({ page }) => {
    await page.goto('/');
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0); // прокрутка произошла
    const top = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBe(0);
  });
});
