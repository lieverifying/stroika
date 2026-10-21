import { expect, test } from '@playwright/test';

// Главная: порядок блоков = ТЗ (0 — шапка, 1–13 — main, 14 — футер), якоря не прячутся под шапкой
test.describe('главная', () => {
  test('короткая главная (2026-10-21): первый экран → сюжет кухни → роботи → квиз → FAQ → финал → подвал', async ({ page }) => {
    await page.goto('/kukhni');
    const order = await page.locator('[data-block]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-block'))));
    expect(order).toEqual([1, 3, 5, 12, 13, 14]);
    // сюжет кухни — сразу под первым экраном
    const next = await page.locator('[data-block="1"]').evaluate((el) => el.nextElementSibling?.querySelector('[data-story]')?.getAttribute('data-story'));
    expect(next).toBe('kitchen');
    for (const gone of ['#team-title', '#prices-title', '#zapyt', '#process-title']) await expect(page.locator(gone)).toHaveCount(0);
    await expect(page.locator('h1')).toHaveCount(1);
  });

  for (const anchor of ['kvyz', 'zamir']) {
    test(`якорь #${anchor}: заголовок блока виден под шапкой`, async ({ page }) => {
      await page.goto(`/kukhni#${anchor}`);
      const title = page.locator(`#${anchor} h2`);
      await expect(title).toBeInViewport(); // браузер докрутил до якоря
      const headerBottom = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().bottom);
      await expect.poll(() => title.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
    });
  }
});

test.describe('первый экран и финал', () => {
  test('первый экран: H1, одна строка, две кнопки', async ({ page }) => {
    await page.goto('/kukhni');
    const hero = page.locator('[data-block="1"]');
    await expect(hero.locator('.hero__lead')).toHaveText('Замір, дизайн-проєкт і монтаж — наша команда');
    await expect(hero.locator('ul')).toHaveCount(0);
    await expect(hero.getByRole('link', { name: 'Розрахувати вартість' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Написати у Viber' })).toBeVisible();
  });

  test('финал: крупные «Подзвонити» и «Viber» + короткая форма (ім’я, телефон, согласие)', async ({ page }) => {
    await page.goto('/kukhni');
    const fin = page.locator('[data-block="13"]');
    const call = fin.getByRole('link', { name: 'Подзвонити' });
    await expect(call).toHaveAttribute('href', 'tel:+380759914843');
    await expect(fin.getByRole('link', { name: 'Viber', exact: true })).toHaveAttribute('href', 'viber://chat?number=%2B380759914843');
    expect((await call.boundingBox())!.height).toBeGreaterThanOrEqual(56);
    const fields = await fin.locator('form input:not([type="hidden"]), form select').evaluateAll((els) =>
      els.filter((e) => !e.closest('.hp')).map((e) => e.getAttribute('name')),
    );
    expect(fields).toEqual(['name', 'phone', 'consent']);
  });

  test('автопереносов нет', async ({ page }) => {
    await page.goto('/kukhni');
    for (const sel of ['h1', 'h2', 'p', 'li']) {
      await expect(page.locator(sel).first()).toHaveCSS('hyphens', 'none');
    }
  });
});
