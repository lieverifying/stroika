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
    await expect(hero.locator('.home-hero__eyebrow')).toHaveText('Кухні, шафи та гардеробні · Черкаси');
    await expect(hero.locator('h1')).toHaveText('Меблі, які точно підходять');
    await expect(hero.locator('.dim__label')).toHaveText(['точно під ваш розмір', '2700 мм']);
    await expect(hero.locator('.home-hero__lead')).toHaveText(
      'Кухні, шафи та гардеробні під ваш простір. Замір, дизайн-проєкт і монтаж — наша команда.',
    );
    await expect(hero.locator('img')).toHaveAttribute('src', /\/kukhnia-05-960\.webp$/);
    const cta = hero.getByRole('link', { name: 'Порахувати вартість' });
    await expect(cta).toHaveAttribute('href', '/kukhni?kvyz=start#kvyz');
    await expect(cta).toHaveAttribute('data-cta', 'primary');
    await expect(hero).toContainText('Ціну надішлемо у Viber або Telegram');
  });

  test('три обіцянки: белые карточки, над каждой размерная линия на всю ширину с подписью «01 · розмір»', async ({ page }) => {
    await page.goto('/');
    const p = page.locator('[data-block="promises"]');
    await expect(p.locator('.dim__label')).toHaveText(['01 · розмір', '02 · ціна', '03 · месенджер']);
    await expect(p.locator('h3')).toHaveText(['Точно під ваш розмір', 'Точна ціна', 'Точно у ваш месенджер']);
    await expect(p).toContainText('Ціну фіксуємо в договорі. Без доплат у процесі.');
    await expect(p.locator('.dim').first()).toHaveCSS('color', 'rgb(138, 90, 51)');
    await expect(p.locator('.dim__label').first()).toHaveCSS('font-family', /JetBrains Mono/);
    for (const item of await p.locator('.promises__item').all()) {
      await expect(item).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      const [card, dim] = await Promise.all([item.boundingBox(), item.locator('.dim').boundingBox()]);
      expect(Math.abs(dim!.width - (card!.width - 40))).toBeLessThan(2); // на всю ширину колонки за вычетом отступов
    }
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

  test('«Як ми створюємо»: 7 кадров сменяются сами (~2,5 с), точки и подпись этапа, пауза на наведении', async ({ page, isMobile }) => {
    await page.goto('/');
    const t = page.locator('[data-block="story-teaser"]');
    await expect(t).toHaveCSS('background-color', 'rgb(30, 33, 36)');
    await expect(t.locator('[data-frame]')).toHaveCount(7);
    await expect(t.locator('[data-dot]')).toHaveCount(7);
    await t.scrollIntoViewIfNeeded();
    await expect(t.locator('.teaser__count')).toHaveText('01 / 07');
    await expect(t.locator('.teaser__stage')).toHaveText('Почнемо з вашого розміру');
    await expect(t.locator('.teaser__count')).toHaveText('02 / 07', { timeout: 4000 });
    await expect(t.locator('.teaser__stage')).toHaveText('Дизайн-проєкт');
    await expect(t.locator('[data-frame].is-on')).toHaveCount(1);
    await expect(t.locator('[data-dot].is-on')).toHaveAttribute('data-dot', '1');
    if (!isMobile) {
      await t.locator('.teaser__frames').hover();
      const paused = await t.locator('.teaser__count').innerText();
      await page.waitForTimeout(3000);
      await expect(t.locator('.teaser__count')).toHaveText(paused);
    }
    await expect(t.locator('h2')).toHaveText('Подивіться, як ми створюємо меблі — від порожньої стіни до готової кухні');
    await expect(t).toContainText('Візуалізація етапів');
    await expect(t.getByRole('link')).toHaveAttribute('href', '/yak-my-stvoriuiemo');
  });

  test('«Як ми створюємо» при prefers-reduced-motion: финальный кадр «Готово», без смены', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/');
    const t = page.locator('[data-block="story-teaser"]');
    await t.scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);
    await expect(t.locator('.teaser__count')).toHaveText('07 / 07');
    await expect(t.locator('.teaser__stage')).toHaveText('Готово');
    await expect(t.locator('[data-frame].is-on')).toHaveAttribute('data-frame', '6');
    await ctx.close();
  });

  test('H2 мельче: −15 % на телефоне, −25 % на десктопе; H1 прежний', async ({ page, isMobile }) => {
    for (const path of ['/', '/kukhni', '/mebli']) {
      await page.goto(path);
      const h2 = parseFloat(await page.locator('main h2').first().evaluate((e) => getComputedStyle(e).fontSize));
      expect(h2, path).toBeCloseTo(isMobile ? 20.4 : 30, 0);
      const h1 = parseFloat(await page.locator('h1').evaluate((e) => getComputedStyle(e).fontSize));
      expect(h1, path).toBeCloseTo(isMobile ? 28 : 46, 0);
    }
    await page.goto('/kontakty');
    const other = parseFloat(await page.locator('#zapyt-title').evaluate((e) => getComputedStyle(e).fontSize));
    expect(other).toBeGreaterThan(isMobile ? 21 : 33); // на остальных страницах размер прежний
  });

  test('роботи: 6 фото разных категорий, «Усі роботи» → /roboty', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('[data-block="3"] .pf__item');
    await expect(items).toHaveCount(6);
    const cats = new Set(await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category)));
    expect(cats.size).toBeGreaterThanOrEqual(3);
    await expect(page.locator('[data-block="3"]').getByRole('link', { name: 'Усі роботи' })).toHaveAttribute('href', '/roboty');
  });

  test('«Без колл-центру»: текст без номера телефона (номер — в финале)', async ({ page }) => {
    await page.goto('/');
    const b = page.locator('[data-block="no-call-center"]');
    await expect(b).toContainText('Відповідає людина, яка веде ваш проєкт');
    await expect(b).toContainText('Від першого повідомлення до монтажу ви спілкуєтесь з тим, хто знає ваш проєкт.');
    await expect(b.locator('a[href^="tel:"]')).toHaveCount(0);
    await expect(b).not.toContainText('991 48 43');
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

test('«Порахувати вартість» с главной (шапка, первый экран, нижняя панель) открывает квиз с шага 1 без предвыбора', async ({ page, isMobile }) => {
  await page.goto('/');
  const links = [page.locator('[data-block="1"] [data-cta]')];
  if (isMobile) links.push(page.locator('[data-bottom-bar] [data-cta]'));
  else links.push(page.locator('[data-header] [data-cta]').first());
  for (const l of links) await expect(l).toHaveAttribute('href', '/kukhni?kvyz=start#kvyz');
  await page.locator('[data-block="1"] [data-cta]').click();
  await expect(page.locator('[data-quiz]')).toHaveAttribute('data-ready', '');
  const step = page.locator('[data-quiz] [data-step]:not([hidden])');
  await expect(step).toHaveAttribute('data-step', 'goal');
  await expect(step.locator('[aria-checked="true"]')).toHaveCount(0);
  await expect(page.locator('[data-quiz-progress-text]')).toHaveText('Крок 1');
  await step.getByRole('radio', { name: 'Шафа або гардеробна' }).click();
  await expect(page.locator('[data-quiz-progress-text]')).toHaveText('Крок 2 з 5');
});

test('шапка 1024–1239 px: пункты меню в одну строку, телефон — только иконкой; с 1240 px — с номером', async ({ page, isMobile }) => {
  test.skip(isMobile, 'только десктоп');
  for (const [w, path] of [[1024, '/'], [1100, '/kukhni'], [1239, '/mebli'], [1240, '/kukhni']] as const) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.goto(path);
    const links = page.locator('[data-header] nav[aria-label="Головне меню"] a:visible');
    for (const a of await links.all()) expect((await a.boundingBox())!.height, `${w} ${path}`).toBeLessThanOrEqual(48);
    const cta = page.locator('[data-header] [data-cta]').first();
    expect((await cta.boundingBox())!.height, `${w} кнопка`).toBeLessThanOrEqual(52);
    const phone = page.locator('[data-header] .header-phone');
    await expect(phone).toHaveAttribute('href', 'tel:+380759914843');
    if (w < 1240) await expect(phone.locator('.header-phone__number')).toBeHidden();
    else await expect(phone.locator('.header-phone__number')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  }
});
