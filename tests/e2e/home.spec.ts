import { expect, test } from './fixtures';

// Главная бренда (ТЗ v2, 2026-10-21): первый экран → три обіцянки → две двери → «Як ми створюємо» → роботи
// → «Без колл-центру» → финал → подвал. Якоря квиза на посадочной не прячутся под шапкой.
test.describe('главная бренда', () => {
  test('порядок блоков и один H1', async ({ page }) => {
    await page.goto('/');
    const order = await page.locator('main [data-block]').evaluateAll((els) => els.map((e) => e.getAttribute('data-block')));
    expect(order).toEqual(['1', 'promises', 'doors', 'story-teaser', '3', 'no-call-center', '13']);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('[data-header]')).toBeVisible();
    await expect(page.locator('footer[data-block="14"]')).toBeVisible();
  });

  test('первый экран: надпись, слоган, размерные линии, подзаголовок, kukhnia-05, жёлтая кнопка и строка под ней', async ({ page }) => {
    await page.goto('/');
    const hero = page.locator('[data-block="1"]');
    await expect(hero.locator('.home-hero__eyebrow')).toHaveText('Корпусні меблі на замовлення · Черкаси');
    await expect(hero.locator('h1')).toHaveText('Меблі, які точно підходять');
    await expect(hero.locator('.dim__label')).toHaveText(['точно під ваш розмір', '2700 мм']);
    await expect(hero.locator('.home-hero__lead')).toHaveText(
      'Кухні, шафи та гардеробні під ваш простір. Замір, дизайн-проєкт і монтаж — наша команда.',
    );
    await expect(hero.locator('img')).toHaveAttribute('src', /\/kukhnia-05\.webp$/);
    const cta = hero.getByRole('link', { name: 'Порахувати вартість' });
    await expect(cta).toHaveAttribute('href', '/kukhni#kvyz');
    await expect(cta).toHaveAttribute('data-cta', 'primary');
    await expect(hero).toContainText('Ціну надішлемо у Viber або Telegram');
  });

  test('три обіцянки 01–03', async ({ page }) => {
    await page.goto('/');
    const p = page.locator('[data-block="promises"]');
    await expect(p.locator('.promises__num')).toHaveText(['01', '02', '03']);
    await expect(p.locator('h3')).toHaveText(['Точно під ваш розмір', 'Точна ціна', 'Точно у ваш месенджер']);
    await expect(p).toContainText('Ціну фіксуємо в договорі. Без доплат у процесі.');
    await expect(p.locator('.promises__num').first()).toHaveCSS('color', 'rgb(138, 90, 51)');
  });

  test('две двери: «Кухні» (kukhnia-06) → /kukhni, «Шафи та меблі» (shafa-01) → /mebli', async ({ page }) => {
    await page.goto('/');
    const doors = page.locator('[data-block="doors"] a');
    await expect(doors).toHaveCount(2);
    await expect(doors.nth(0)).toHaveAttribute('href', '/kukhni');
    await expect(doors.nth(0).locator('img')).toHaveAttribute('src', /kukhnia-06/);
    await expect(doors.nth(1)).toHaveAttribute('href', '/mebli');
    await expect(doors.nth(1).locator('img')).toHaveAttribute('src', /shafa-01/);
    await doors.nth(1).click();
    await expect(page).toHaveURL(/\/mebli$/);
  });

  test('«Як ми створюємо»: тёмный блок, «04 / 07», подпись «Візуалізація етапів», ссылка', async ({ page }) => {
    await page.goto('/');
    const t = page.locator('[data-block="story-teaser"]');
    await expect(t).toHaveCSS('background-color', 'rgb(30, 33, 36)');
    await expect(t.locator('.teaser__count')).toHaveText('04 / 07');
    await expect(t.locator('h2')).toHaveText('Подивіться, як ми створюємо меблі — від порожньої стіни до готової кухні');
    await expect(t).toContainText('Візуалізація етапів');
    await expect(t.getByRole('link')).toHaveAttribute('href', '/yak-my-stvoriuiemo');
  });

  test('роботи: 6 фото разных категорий, «Усі роботи» → /roboty', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('[data-block="3"] .pf__item');
    await expect(items).toHaveCount(6);
    const cats = new Set(await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category)));
    expect(cats.size).toBeGreaterThanOrEqual(3);
    await expect(page.locator('[data-block="3"]').getByRole('link', { name: 'Усі роботи' })).toHaveAttribute('href', '/roboty');
  });

  test('«Без колл-центру»: текст и телефон', async ({ page }) => {
    await page.goto('/');
    const b = page.locator('[data-block="no-call-center"]');
    await expect(b).toContainText('Відповідає людина, яка веде ваш проєкт');
    await expect(b).toContainText('Від першого повідомлення до монтажу ви спілкуєтесь з тим, хто знає ваш проєкт.');
    await expect(b.locator('a[href="tel:+380759914843"]')).toContainText('+380 75 991 48 43');
  });

  test('финал: «Скажіть розмір — ми скажемо ціну», Viber, Telegram, Подзвонити', async ({ page }) => {
    await page.goto('/');
    const fin = page.locator('[data-block="13"]');
    await expect(fin.locator('h2')).toHaveText('Скажіть розмір — ми скажемо ціну');
    await expect(fin).toContainText('Надішліть розміри або фото приміщення — розрахунок прийде в месенджер.');
    await expect(fin.locator('.btn')).toHaveText(['Viber', 'Telegram', 'Подзвонити']);
    await expect(fin.getByRole('link', { name: 'Viber' })).toHaveAttribute('href', 'viber://chat?number=%2B380759914843');
    await expect(fin.getByRole('link', { name: 'Telegram' })).toHaveAttribute('href', 'https://t.me/+380759914843');
    await expect(fin.getByRole('link', { name: 'Подзвонити' })).toHaveAttribute('href', 'tel:+380759914843');
    await expect(fin.locator('form')).toHaveCount(0);
  });

  test('автопереносов нет', async ({ page }) => {
    await page.goto('/');
    for (const sel of ['h1', 'h2', 'p', 'li']) {
      await expect(page.locator(sel).first()).toHaveCSS('hyphens', 'none');
    }
  });
});

test('якорь #kvyz на посадочной: заголовок квиза виден под шапкой', async ({ page }) => {
  await page.goto('/kukhni#kvyz');
  const title = page.locator('#kvyz h2');
  await expect(title).toBeInViewport();
  const headerBottom = await page.locator('[data-header]').evaluate((el) => el.getBoundingClientRect().bottom);
  await expect.poll(() => title.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
});
