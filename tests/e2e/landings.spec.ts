import { expect, test } from '@playwright/test';

// Две посадочные (2026-10-21, структура — ТЗ v2): фото, H1 → сюжет → работы → квиз → три обіцянки → вопросы → финал

for (const l of [
  {
    path: '/kukhni',
    other: '/mebli',
    h1: 'Кухні на замовлення в Черкасах',
    title: 'Кухні на замовлення в Черкасах — Вимір',
    story: 'kitchen',
    photo: 'kukhnia-06',
    cats: ['kukhni'],
    works: 6,
    active: 'Кухні',
  },
  {
    path: '/mebli',
    other: '/kukhni',
    h1: 'Шафи, гардеробні та корпусні меблі під ваш розмір',
    title: 'Шафи, гардеробні та корпусні меблі на замовлення в Черкасах — Вимір',
    story: 'wardrobe',
    photo: 'shafa-01',
    cats: ['shafy', 'garderobni', 'inshi'],
    works: 4,
    active: 'Меблі',
  },
] as const) {
  test.describe(l.path, () => {
    test('структура: фото, H1 → сюжет → работы → квиз → три обіцянки → вопросы → финал', async ({ page }) => {
      await page.goto(l.path);
      await expect(page).toHaveTitle(l.title);
      await expect(page.locator('h1')).toHaveText(l.h1);
      await expect(page.locator('[data-block="1"] img')).toHaveAttribute('src', new RegExp(`${l.photo}\\.webp$`));
      await expect(page.locator('[data-block="1"]').getByRole('link', { name: 'Написати у Viber' })).toBeVisible();
      const order = await page.locator('main [data-block], main [data-story]').evaluateAll((els) =>
        els.map((e) => e.getAttribute('data-block') ?? `story:${e.getAttribute('data-story')}`),
      );
      expect(order).toEqual(['1', `story:${l.story}`, '3', '5', 'promises', '12', '13']);
      await expect(page.locator('main')).toContainText('Візуалізація етапів');
      await expect(page.locator('[data-block="13"] h2')).toHaveText('Скажіть розмір — ми скажемо ціну');
    });

    test('работы — только своей категории, крупные фото', async ({ page }) => {
      await page.goto(l.path);
      const cats = await page.locator('[data-block="3"] .pf__item').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category));
      expect(cats).toHaveLength(l.works);
      for (const c of cats) expect(l.cats as readonly string[]).toContain(c);
    });

    test('квиз свёрнут: сначала только шаг 1 из карточек; «Порахувати вартість» ведёт в квиз этой страницы', async ({ page, isMobile }) => {
      await page.goto(`${l.path}#kvyz`);
      await expect(page.locator('[data-quiz]')).toHaveAttribute('data-ready', '');
      await expect(page.locator('[data-quiz] [data-step]:visible')).toHaveCount(1);
      await expect(page.locator('[data-quiz] [data-step]:not([hidden])')).toHaveAttribute('data-step', 'goal');
      await expect(page.locator('[data-step="goal"] [aria-checked="true"]')).toHaveCount(0);
      await expect(page.locator('[data-block="1"]').getByRole('link', { name: 'Порахувати вартість' })).toHaveAttribute('href', `${l.path}#kvyz`);
      if (isMobile) await expect(page.locator('[data-bottom-bar] [data-cta]')).toHaveAttribute('href', `${l.path}#kvyz`);
    });

    test('6 вопросов FAQ; цена и срок — «Розрахуємо під ваше завдання і надішлемо у месенджер.»', async ({ page }) => {
      await page.goto(l.path);
      const faq = page.locator('[data-block="12"]');
      await expect(faq.locator('summary')).toHaveText([
        'Скільки коштує?',
        'Скільки часу займає?',
        'Чим ви відрізняєтесь від модульних меблів з мережевого магазину?',
        'Чи можна за моїм дизайн-проєктом?',
        'Чи встановлюєте техніку і мийку?',
        'Чи працюєте в області?',
      ]);
      await faq.locator('summary').first().click();
      await expect(faq.locator('details').first()).toContainText('Розрахуємо під ваше завдання і надішлемо у месенджер.');
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
      await page.goto(`${l.path}#kvyz`);
      await expect(page.locator('[data-quiz]')).toHaveAttribute('data-ready', '');
      const step = page.locator('[data-quiz] [data-step]:not([hidden])');
      for (const label of ['Інші меблі', 'Передпокій', 'Пізніше']) await step.getByRole('radio', { name: label, exact: true }).click();
      await page.locator('#quiz-name').fill('Тест');
      await page.locator('#quiz-phone').click();
      await page.locator('#quiz-phone').pressSequentially('0671234567');
      await page.locator('#quiz-consent').check();
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
      await step.getByRole('button', { name: 'Отримати ціну' }).click();
      await expect(page).toHaveURL(/\/dyakuyemo$/);
      const leads = await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.leads') ?? '[]') as { event: string }[]);
      expect(leads.filter((e) => e.event === 'lead_submit')).toEqual([{ event: 'lead_submit', form: 'quiz', landing: l.path.slice(1) }]);
    });
  });
}

test('title, description и H1 у /kukhni и /mebli разные', async ({ page }) => {
  const grab = async (path: string) => {
    await page.goto(path);
    return {
      h1: await page.locator('h1').innerText(),
      title: await page.title(),
      desc: await page.locator('meta[name="description"]').getAttribute('content'),
    };
  };
  const k = await grab('/kukhni');
  const m = await grab('/mebli');
  expect(k.h1).not.toBe(m.h1);
  expect(k.title).not.toBe(m.title);
  expect(k.desc).not.toBe(m.desc);
});

test('/kukhni — отдельная страница, без перенаправления на «/»', async ({ page }) => {
  const res = await page.goto('/kukhni');
  expect(res!.status()).toBe(200);
  await expect(page).toHaveURL(/\/kukhni$/);
});
