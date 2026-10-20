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
      const title = page.locator(`#${anchor} h2`);
      await expect(title).toBeInViewport(); // браузер докрутил до якоря
      const headerBottom = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().bottom);
      await expect.poll(() => title.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
    });
  }
});

test.describe('блоки 6 и 7', () => {
  test('блок 6 — «Своя команда»: фото команды и текст о монтаже, без карточек мастеров и «субпідрядників»', async ({ page }) => {
    await page.goto('/');
    const block = page.locator('[data-block="6"]');
    await expect(page.locator('#team-title')).toHaveText('Своя команда');
    await expect(block).toContainText('Замір, дизайн-проєкт і монтаж — наша команда.');
    await expect(block).toContainText('фабрики-партнери');
    await expect(block.locator('.team__install li')).toHaveText([
      'врізка мийки та варильної поверхні',
      'вбудована техніка',
      'підключення води та розеток',
      'прибирання',
    ]);
    await expect(block.locator('.team__card')).toHaveCount(0); // карточки мастеров за флагом flags.teamCards
    await expect(block.locator('.team__photo .ph')).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText(/субпідряд|бригад/i);
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
