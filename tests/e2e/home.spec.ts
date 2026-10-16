import { expect, test } from '@playwright/test';

// Главная: порядок блоков = ТЗ (0 — шапка, 1–13 — main, 14 — футер), якоря не прячутся под шапкой
test.describe('главная', () => {
  test('блоки 1–14 идут строго по порядку ТЗ', async ({ page }) => {
    await page.goto('/');
    const order = await page.locator('[data-block]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-block'))));
    expect(order).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    await expect(page.locator('h1')).toHaveCount(1);
  });

  for (const anchor of ['kvyz', 'zamir']) {
    test(`якорь #${anchor}: заголовок блока виден под шапкой`, async ({ page }) => {
      await page.goto(`/#${anchor}`);
      await page.waitForTimeout(300);
      const headerBottom = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().bottom);
      const titleTop = await page.locator(`#${anchor} h2`).evaluate((el) => el.getBoundingClientRect().top);
      expect(titleTop).toBeGreaterThanOrEqual(headerBottom);
    });
  }
});

test.describe('блоки 6 и 7', () => {
  test('бригада: фото, имя и роль первого мастера помещаются в один экран', async ({ page, isMobile }) => {
    await page.goto('/');
    const card = page.locator('.team__card').first();
    const headerH = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().height);
    await card.evaluate((el, h) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - h - 16), headerH);
    const role = (await card.locator('.team__role').boundingBox())!;
    const vh = page.viewportSize()!.height;
    const barH = isMobile ? await page.locator('[data-bottom-bar]').evaluate((el) => el.getBoundingClientRect().height) : 0;
    expect(role.y + role.height).toBeLessThanOrEqual(vh - barH);
  });

  test('заголовок блока 6 без слова «своя»: значение по умолчанию «Наші майстри»', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#team-title')).toHaveText('Наші майстри');
  });

  test('десктоп: описания всех пяти шагов начинаются на одной линии', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/');
    const tops = await page.locator('.process__text').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1);
  });

  test('автопереносов нет', async ({ page }) => {
    await page.goto('/');
    for (const sel of ['h1', 'h2', 'p', 'li']) {
      await expect(page.locator(sel).first()).toHaveCSS('hyphens', 'none');
    }
  });
});
