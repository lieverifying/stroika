import { expect, test } from '@playwright/test';

// Две посадочные и экран выбора (решение владельца, 2026-10-21)

test.describe('«/» — экран выбора', () => {
  test('логотип, строка, две плитки «Кухні» и «Шафи та меблі», телефон и Viber — больше ничего', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('Корпусні меблі під ваш розмір у Черкасах');
    await expect(page.locator('img[alt="Вимір"]')).toHaveCount(1);
    const tiles = page.getByRole('navigation', { name: 'Оберіть, що потрібно' }).getByRole('link');
    await expect(tiles).toHaveText(['Кухні', 'Шафи та меблі']);
    await expect(tiles.nth(0)).toHaveAttribute('href', '/kukhni');
    await expect(tiles.nth(1)).toHaveAttribute('href', '/mebli');
    await expect(page.locator('a[href="tel:+380759914843"]')).toContainText('+380 75 991 48 43');
    await expect(page.getByRole('link', { name: 'Viber' })).toHaveAttribute('href', 'viber://chat?number=%2B380759914843');
    // ни шапки, ни подвала, ни нижней панели, ни форм
    for (const sel of ['[data-header]', 'footer[data-block="14"]', '[data-bottom-bar]', 'form', '[data-quiz]']) await expect(page.locator(sel)).toHaveCount(0);
    await expect(page.locator('main a')).toHaveCount(4);
  });

  test('плитки на весь экран: на телефоне одна под другой, на десктопе рядом; всё в одном экране', async ({ page, isMobile }) => {
    await page.goto('/');
    const [a, b] = await page.locator('.choice__tile').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    if (isMobile) expect(b.top).toBeGreaterThanOrEqual(a.bottom);
    else expect(Math.abs(a.top - b.top)).toBeLessThan(1);
    const bottom = await page.locator('.choice__bottom').evaluate((e) => e.getBoundingClientRect().bottom);
    expect(bottom).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    expect(a.height).toBeGreaterThan(200);
  });

  test('клик по плитке ведёт на посадочную', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Шафи та меблі' }).click();
    await expect(page).toHaveURL(/\/mebli$/);
  });
});

for (const l of [
  {
    path: '/kukhni',
    other: '/mebli',
    h1: 'Кухні на замовлення в Черкасах',
    title: 'Кухні на замовлення в Черкасах — Вимір',
    story: 'kitchen',
    preset: 'kitchen',
    cats: ['kuhni'],
    active: 'Кухні',
  },
  {
    path: '/mebli',
    other: '/kukhni',
    h1: 'Шафи, гардеробні та корпусні меблі під ваш розмір у Черкасах',
    title: 'Шафи, гардеробні та корпусні меблі на замовлення в Черкасах — Вимір',
    story: 'wardrobe',
    preset: 'wardrobe',
    cats: ['shafy', 'interier', 'komertsiia'],
    active: 'Меблі',
  },
] as const) {
  test.describe(l.path, () => {
    test('структура: фото и одна строка → сюжет → работы → квиз → вопросы → «Подзвонити», «Viber» и форма', async ({ page }) => {
      await page.goto(l.path);
      await expect(page).toHaveTitle(l.title);
      await expect(page.locator('h1')).toHaveText(l.h1);
      const order = await page.locator('main [data-block], main [data-story]').evaluateAll((els) =>
        els.map((e) => e.getAttribute('data-block') ?? `story:${e.getAttribute('data-story')}`),
      );
      expect(order).toEqual(['1', `story:${l.story}`, '3', '5', '12', '13']);
      await expect(page.locator('[data-block="13"]').getByRole('link', { name: 'Подзвонити' })).toBeVisible();
    });

    test('работы — только своей категории, 6 крупных фото', async ({ page }) => {
      await page.goto(l.path);
      const cats = await page.locator('[data-block="3"] .pf__item').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category));
      expect(cats).toHaveLength(6);
      for (const c of cats) expect(l.cats as readonly string[]).toContain(c);
    });

    test('квиз на шаге 1 с выбранной веткой; «Розрахувати» ведёт в квиз этой страницы', async ({ page, isMobile }) => {
      await page.goto(`${l.path}#kvyz`);
      await expect(page.locator('[data-quiz]')).toHaveAttribute('data-ready', '');
      await expect(page.locator('[data-quiz] [data-step]:not([hidden])')).toHaveAttribute('data-step', 'goal');
      await expect(page.locator(`[data-step="goal"] [data-value="${l.preset}"]`)).toHaveAttribute('aria-checked', 'true');
      await expect(page.locator('[data-block="1"]').getByRole('link', { name: 'Розрахувати вартість' })).toHaveAttribute('href', `${l.path}#kvyz`);
      if (isMobile) await expect(page.locator('[data-bottom-bar] [data-cta]')).toHaveAttribute('href', `${l.path}#kvyz`);
    });

    test('переключатель «Кухні · Меблі»: активный выделен; меню Кухні · Меблі · Роботи · Як ми створюємо · Контакти', async ({ page, isMobile }) => {
      await page.goto(l.path);
      const sw = page.getByRole('navigation', { name: 'Кухні або меблі' });
      await expect(sw).toBeVisible();
      await expect(sw.getByRole('link')).toHaveText(['Кухні', 'Меблі']);
      const act = sw.getByRole('link', { name: l.active });
      await expect(act).toHaveAttribute('aria-current', 'page');
      await expect(act).toHaveCSS('background-color', 'rgb(30, 33, 36)');
      for (const a of await sw.getByRole('link').all()) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      if (!isMobile) {
        await expect(page.getByRole('navigation', { name: 'Головне меню' }).getByRole('link')).toHaveText(['Кухні', 'Меблі', 'Роботи', 'Як ми створюємо', 'Контакти']);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await sw.getByRole('link', { name: l.active === 'Кухні' ? 'Меблі' : 'Кухні' }).click();
      await expect(page).toHaveURL(new RegExp(`${l.other}$`));
    });

    test('заявка помечается страницей-источником (аналитика)', async ({ page }) => {
      await page.goto(l.path);
      await page.locator('#zamir-name').fill('Тест');
      await page.locator('#zamir-phone').click();
      await page.locator('#zamir-phone').pressSequentially('0671234567');
      await page.locator('#zamir-consent').check();
      await page.evaluate(() => {
        const w = window as unknown as { dataLayer?: unknown[]; leads: unknown[] };
        w.dataLayer ??= [];
        w.leads = [];
        const push = w.dataLayer.push.bind(w.dataLayer);
        w.dataLayer.push = (...items: unknown[]) => {
          w.leads.push(...items);
          sessionStorage.setItem('test.leads', JSON.stringify(w.leads));
          return push(...items);
        };
      });
      await page.locator('#zamir form').getByRole('button', { name: 'Надіслати заявку' }).click();
      await expect(page).toHaveURL(/\/dyakuyemo$/);
      const leads = await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.leads') ?? '[]'));
      expect(leads).toEqual([{ event: 'lead_submit', form: 'zamir', landing: l.path.slice(1) }]);
    });
  });
}

test('тексты /kukhni и /mebli не повторяются дословно; title и description разные', async ({ page }) => {
  const grab = async (path: string) => {
    await page.goto(path);
    return {
      texts: await page.locator('main h1, main .hero__lead, main h2, main .section-title__subtitle, main summary').allInnerTexts(),
      title: await page.title(),
      desc: await page.locator('meta[name="description"]').getAttribute('content'),
    };
  };
  const k = await grab('/kukhni');
  const m = await grab('/mebli');
  const shared = k.texts.filter((t) => m.texts.includes(t) && t.length > 25);
  expect(shared).toEqual([]);
  expect(k.title).not.toBe(m.title);
  expect(k.desc).not.toBe(m.desc);
});

test('/kukhni — отдельная страница, без перенаправления на «/»', async ({ page }) => {
  const res = await page.goto('/kukhni');
  expect(res!.status()).toBe(200);
  await expect(page).toHaveURL(/\/kukhni$/);
});
