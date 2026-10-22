import { expect, test, type Page } from './fixtures';
import { nextFrames, noTransitions, yellowOnScreen } from './helpers';

// /planuvannya — лендинг под рекламу Meta: лид-магнит «Два варіанти планування» и запасной безкоштовний замір
const PATH = '/planuvannya';

/** dataLayer и fbq переживают переход на /dyakuyemo через sessionStorage */
async function spyAnalytics(page: Page) {
  await page.addInitScript(() => {
    const save = (k: string, v: unknown) => {
      const list = JSON.parse(sessionStorage.getItem(k) ?? '[]');
      list.push(v);
      sessionStorage.setItem(k, JSON.stringify(list));
    };
    const w = window as unknown as { dataLayer: unknown[]; fbq: (...a: unknown[]) => void };
    w.dataLayer = [];
    const push = w.dataLayer.push.bind(w.dataLayer);
    w.dataLayer.push = (...items: unknown[]) => {
      items.forEach((i) => save('test.dl', i));
      return push(...items);
    };
    w.fbq = (...args: unknown[]) => save('test.fbq', args);
  });
}
const stored = (page: Page, key: string) => page.evaluate((k) => JSON.parse(sessionStorage.getItem(k) ?? '[]'), key);

test('только логотип: без меню, переключателя, подвала и нижней панели; noindex', async ({ page }) => {
  await page.goto(PATH);
  await expect(page.locator('img[alt="Вимір"]')).toHaveCount(1);
  for (const sel of ['[data-header]', '[data-landing-switch]', 'footer', '[data-bottom-bar]', 'nav']) await expect(page.locator(sel)).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('main')).not.toContainText('Подивитися всі роботи');
});

test('«Переглянути сайт» — кнопка с обводкой после работ и в финале, ведёт на главную; на первом экране её нет', async ({ page }) => {
  await page.goto(PATH);
  const site = page.locator('[data-site-link]');
  await expect(site).toHaveCount(2);
  await expect(site).toHaveText(['Переглянути сайт', 'Переглянути сайт']);
  for (const b of await site.all()) {
    await expect(b).toHaveAttribute('href', '/');
    await expect(b).toHaveClass(/btn--outline/);
    await expect(b).not.toHaveAttribute('data-cta', 'primary');
    expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  }
  await expect(page.locator('[data-block="3"] [data-site-link]')).toHaveCount(1);
  await expect(page.locator('[data-block="13"] [data-site-link]')).toHaveCount(1);
  await expect(page.locator('[data-block="1"] [data-site-link], [data-block="1"] a[href="/"]')).toHaveCount(0);
});

test('первый экран: kukhnia-05, H1, подзаголовок со сроком 36 годин, «Надіслати план» к форме и «Надіслати у Viber»', async ({ page }) => {
  await page.goto(PATH);
  const hero = page.locator('[data-block="1"]');
  await expect(hero.locator('h1')).toHaveText('Два варіанти планування вашої кухні — безкоштовно');
  await expect(hero.locator('.hero__lead')).toHaveText(
    'Надішліть фото або план приміщення з розмірами — дизайнер підготує два варіанти розташування протягом 36 годин у робочі дні і надішле розрахунок у Viber або Telegram.',
  );
  await expect(hero.locator('img')).toHaveAttribute('src', /kukhnia-05-960\.webp$/);
  const cta = hero.getByRole('link', { name: 'Надіслати план' });
  await expect(cta).toHaveAttribute('href', '#plan');
  await expect(cta).toHaveAttribute('data-cta', 'primary');
  await expect(hero.getByRole('link', { name: 'Надіслати у Viber' })).toHaveAttribute('href', 'viber://chat?number=%2B380759914843');
  await cta.click();
  await expect(page.locator('#plan h2').first()).toBeInViewport();
});

test('«Як це працює»: 4 шага с номерами, четвёртый — безкоштовний замір', async ({ page }) => {
  await page.goto(PATH);
  const steps = page.locator('[data-block="how"] .plan-steps__item');
  await expect(steps.locator('.plan-steps__num')).toHaveText(['01', '02', '03', '04']);
  await expect(steps.locator('.plan-steps__text')).toHaveText([
    'Надсилаєте фото або план',
    'Дизайнер готує 2 варіанти до 36 годин у робочі дні',
    'Отримуєте розрахунок у месенджер',
    'Безкоштовний замір і точна ціна в договорі',
  ]);
});

test('форма плана: файл, ширина стін, Viber → заявка «plan» с UTM; Lead в Pixel; /dyakuyemo со своим текстом', async ({ page, leadApi }) => {
  await spyAnalytics(page);
  await page.goto(`${PATH}?utm_source=facebook&utm_medium=cpc&utm_campaign=plan-oct`);
  const form = page.locator('form[data-plan-form]');
  await form.locator('#plan-files').setInputFiles([{ name: 'план.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(200) }]);
  await expect(form.locator('[data-files-chosen]')).toHaveText('план.jpg');
  await form.locator('#plan-walls').fill('3,2 і 2,4');
  await expect(form.getByRole('radio', { name: 'Viber' })).toBeChecked();
  await form.locator('#plan-name').fill('Олена');
  await form.locator('#plan-phone').click();
  await form.locator('#plan-phone').pressSequentially('0671234567');
  await form.locator('#plan-consent').check();
  const submit = form.getByRole('button', { name: 'Отримати 2 варіанти' });
  await expect(submit).toHaveAttribute('data-cta', 'primary');
  await submit.click();
  await expect(page).toHaveURL(/\/dyakuyemo$/);
  await expect(page.locator('[data-thanks]')).toHaveText(
    'Дякуємо. Дизайнер підготує два варіанти протягом 36 годин у робочі дні і надішле їх у Viber.',
  );
  expect(leadApi.leads).toHaveLength(1);
  expect(leadApi.leads[0]).toMatchObject({
    contactMethod: 'viber',
    form: 'plan',
    landing: 'planuvannya',
    wallWidths: '3,2 і 2,4',
    name: 'Олена',
    phone: '+380671234567',
    page: '/planuvannya',
    attribution: { utm_source: 'facebook', utm_medium: 'cpc', utm_campaign: 'plan-oct', landingPage: '/planuvannya' },
    __files: ['план.jpg'],
  });
  expect(await stored(page, 'test.fbq')).toEqual([['track', 'Lead', { content_name: 'planuvannya' }]]);
  const dl = (await stored(page, 'test.dl')) as { event: string }[];
  expect(dl.filter((e) => e.event === 'lead_submit')).toEqual([
    { event: 'lead_submit', form: 'plan', landing: 'planuvannya', content_name: 'planuvannya' },
  ]);
});

test('форма плана: пустая отправка — ошибки у имени, телефона, согласия; файлы и ширина необязательны', async ({ page, leadApi }) => {
  await page.goto(`${PATH}#plan`);
  const form = page.locator('form[data-plan-form]');
  await form.getByRole('button', { name: 'Отримати 2 варіанти' }).click();
  await expect(page.locator('#plan-name')).toBeFocused();
  for (const id of ['plan-name', 'plan-phone', 'plan-consent']) await expect(page.locator(`#${id}-error`)).toBeVisible();
  await expect(page.locator('#plan-files-error')).toBeHidden();
  expect(leadApi.leads).toHaveLength(0);
});

test('безкоштовний замір под формой: графитовая кнопка, заявка «zamir» со зручним часом, Lead planuvannya_zamir', async ({ page, leadApi }) => {
  await spyAnalytics(page);
  await page.goto(PATH);
  const box = page.locator('#zamir');
  await expect(box.locator('h2')).toHaveText('Немає плану чи фото? Замовте безкоштовний замір');
  const submit = box.getByRole('button', { name: 'Замовити замір' });
  await expect(submit).not.toHaveAttribute('data-cta', 'primary');
  await expect(submit).toHaveCSS('background-color', 'rgb(30, 33, 36)');
  await box.locator('#pz-name').fill('Ігор');
  await box.locator('#pz-phone').click();
  await box.locator('#pz-phone').pressSequentially('0671234567');
  await box.locator('#pz-time').selectOption('evening');
  await box.locator('#pz-consent').check();
  await submit.click();
  await expect(page).toHaveURL(/\/dyakuyemo$/);
  await expect(page.locator('[data-thanks]')).toHaveText(/^Дякуємо, Ігор\. Зателефонуємо у робочий час\.$/);
  expect(leadApi.leads[0]).toMatchObject({ contactMethod: 'call', form: 'zamir', landing: 'planuvannya', time: 'evening', name: 'Ігор' });
  expect(await stored(page, 'test.fbq')).toEqual([['track', 'Lead', { content_name: 'planuvannya_zamir' }]]);
});

test('работы: 6 фото без подписей; три вопроса, во втором — ссылка на форму заміру; финал', async ({ page }) => {
  await page.goto(PATH);
  const works = page.locator('[data-block="3"]');
  await expect(works.locator('h2')).toHaveText('Роботи нашої команди');
  await expect(works.locator('.pf__item')).toHaveCount(6);
  await expect(works.locator('figcaption, .pf__caption')).toHaveCount(0);
  const faq = page.locator('[data-block="12"]');
  await expect(faq.locator('summary')).toHaveText(['Це справді безкоштовно?', 'Що, якщо в мене немає плану?', 'Чи зобов’язує це мене замовляти?']);
  await faq.locator('summary').nth(1).click();
  await expect(faq.locator('details').nth(1)).toContainText(
    'Надішліть фото кухні та приблизні розміри — цього достатньо. Або замовте безкоштовний замір — приїдемо і все заміряємо самі.',
  );
  await expect(faq.locator('details').nth(1).getByRole('link', { name: 'замовте безкоштовний замір' })).toHaveAttribute('href', '#zamir');
  await faq.locator('summary').nth(2).click();
  await expect(faq.locator('details').nth(2)).toContainText('Ні.');
  const fin = page.locator('[data-block="13"]');
  await expect(fin.getByRole('link', { name: 'Надіслати план' })).toHaveAttribute('href', '#plan');
  await expect(page.locator('main')).not.toContainText(/на тиждень|в тиждень/);
});

test('не больше одного жёлтого на экране, без прокрутки вбок', async ({ page }) => {
  await page.goto(PATH);
  await noTransitions(page);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await nextFrames(page);
    const yellow = await yellowOnScreen(page);
    expect(yellow.length, `y=${y}: ${yellow.join(' | ')}`).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

// /planuvannya-mebli — та же структура про шафи та меблі
test.describe('/planuvannya-mebli', () => {
  const M = '/planuvannya-mebli';

  test('первый экран: shafa-01, H1, подзаголовок, «Надіслати розміри» к форме; без меню; noindex', async ({ page }) => {
    await page.goto(M);
    for (const sel of ['[data-header]', '[data-landing-switch]', 'footer', '[data-bottom-bar]', 'nav']) await expect(page.locator(sel)).toHaveCount(0);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const hero = page.locator('[data-block="1"]');
    await expect(hero.locator('h1')).toHaveText('Два варіанти наповнення вашої шафи — безкоштовно');
    await expect(hero.locator('.hero__lead')).toHaveText(
      'Надішліть фото ніші або кімнати з розмірами — дизайнер запропонує два варіанти полиць, штанг і шухляд протягом 36 годин у робочі дні та надішле розрахунок у Viber або Telegram.',
    );
    await expect(hero.locator('img')).toHaveAttribute('src', /shafa-01-960\.webp$/);
    await expect(hero.getByRole('link', { name: 'Надіслати розміри' })).toHaveAttribute('href', '#plan');
    await expect(hero.getByRole('link', { name: 'Надіслати у Viber' })).toBeVisible();
    await expect(page.locator('[data-block="how"] .plan-steps__text')).toHaveText([
      'Надсилаєте фото і розміри ніші',
      'Дизайнер готує 2 варіанти наповнення до 36 годин у робочі дні',
      'Отримуєте розрахунок у месенджер',
      'Безкоштовний замір і точна ціна в договорі',
    ]);
  });

  test('форма: фото ніші, ширина / висота / глибина, «Що потрібно» → «plan_mebli»; Lead planuvannya_mebli; «Дякуємо» про наповнення', async ({ page, leadApi }) => {
    await spyAnalytics(page);
    await page.goto(`${M}?utm_source=instagram&utm_campaign=shafy`);
    const form = page.locator('form[data-plan-form]');
    await expect(form.locator('label[for="plan-files"]')).toContainText('Фото ніші або кімнати');
    await form.locator('#plan-files').setInputFiles([{ name: 'nisha.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(200) }]);
    await form.locator('#plan-width').fill('2,4');
    await form.locator('#plan-height').fill('2,7');
    await expect(form.locator('#plan-item option')).toHaveText(['Оберіть', 'Шафа-купе', 'Розпашна шафа', 'Гардеробна', 'Передпокій', 'Інше']);
    await form.locator('#plan-item').selectOption('harderobna');
    await form.getByRole('radio', { name: 'Telegram' }).check();
    await form.locator('#plan-name').fill('Марія');
    await form.locator('#plan-phone').click();
    await form.locator('#plan-phone').pressSequentially('0671234567');
    await form.locator('#plan-consent').check();
    await form.getByRole('button', { name: 'Отримати 2 варіанти' }).click();
    await expect(page).toHaveURL(/\/dyakuyemo$/);
    await expect(page.locator('[data-thanks]')).toHaveText(
      'Дякуємо. Дизайнер підготує два варіанти наповнення протягом 36 годин у робочі дні і надішле їх у Telegram.',
    );
    expect(leadApi.leads[0]).toMatchObject({
      contactMethod: 'telegram',
      form: 'plan_mebli',
      landing: 'planuvannya-mebli',
      nicheWidth: '2,4',
      nicheHeight: '2,7',
      nicheDepth: '',
      item: 'harderobna',
      name: 'Марія',
      attribution: { utm_source: 'instagram', utm_campaign: 'shafy' },
      __files: ['nisha.jpg'],
    });
    expect(await stored(page, 'test.fbq')).toEqual([['track', 'Lead', { content_name: 'planuvannya_mebli' }]]);
  });

  test('«Немає розмірів? Замовте безкоштовний замір»: графитовая кнопка, «zamir_mebli», Lead planuvannya_mebli_zamir', async ({ page, leadApi }) => {
    await spyAnalytics(page);
    await page.goto(M);
    const box = page.locator('#zamir');
    await expect(box.locator('h2')).toHaveText('Немає розмірів? Замовте безкоштовний замір');
    const submit = box.getByRole('button', { name: 'Замовити замір' });
    await expect(submit).toHaveCSS('background-color', 'rgb(30, 33, 36)');
    await box.locator('#pz-name').fill('Ігор');
    await box.locator('#pz-phone').click();
    await box.locator('#pz-phone').pressSequentially('0671234567');
    await box.locator('#pz-consent').check();
    await submit.click();
    await expect(page).toHaveURL(/\/dyakuyemo$/);
    expect(leadApi.leads[0]).toMatchObject({ contactMethod: 'call', form: 'zamir_mebli', landing: 'planuvannya-mebli', time: 'soon' });
    expect(await stored(page, 'test.fbq')).toEqual([['track', 'Lead', { content_name: 'planuvannya_mebli_zamir' }]]);
  });

  test('работы — только мебель (5 фото), вопросы, «Переглянути сайт» → /mebli; один жёлтый на экране', async ({ page }) => {
    await page.goto(M);
    const cats = await page.locator('[data-block="3"] .pf__item').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.category));
    expect(cats).toHaveLength(5);
    for (const c of cats) expect(['shafy', 'garderobni', 'inshi']).toContain(c);
    // ряды заполнены целиком: нет карточки, которая стоит одна в ряду и не растянута на ширину
    const rows = await page.locator('[data-block="3"] .pf__item').evaluateAll((els) => {
      const m = new Map<number, number>();
      for (const e of els) {
        const r = e.getBoundingClientRect();
        m.set(Math.round(r.top), (m.get(Math.round(r.top)) ?? 0) + r.width);
      }
      return [...m.values()].map((w) => w / els[0].parentElement!.getBoundingClientRect().width);
    });
    for (const share of rows) expect(share).toBeGreaterThan(0.95);
    const faq = page.locator('[data-block="12"]');
    await expect(faq.locator('summary')).toHaveText(['Це справді безкоштовно?', 'Що, якщо я не знаю точних розмірів?', 'Чи зобов’язує це мене замовляти?']);
    await faq.locator('summary').nth(1).click();
    await expect(faq.locator('details').nth(1)).toContainText('Надішліть фото і приблизні розміри — або замовте безкоштовний замір');
    await expect(faq.locator('details').nth(1).getByRole('link')).toHaveAttribute('href', '#zamir');
    const site = page.locator('[data-site-link]');
    await expect(site).toHaveCount(2);
    for (const b of await site.all()) await expect(b).toHaveAttribute('href', '/mebli');
    await noTransitions(page);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await nextFrames(page);
      expect((await yellowOnScreen(page)).length, `y=${y}`).toBeLessThanOrEqual(1);
    }
  });
});
