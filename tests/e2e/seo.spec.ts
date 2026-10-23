import { expect, test } from './fixtures';

// SEO и аналитика в тестовой сборке (SITE_ENV=development): страницы закрыты от индекса, теги GA4 и Pixel не выводятся.
// Боевую сборку (index,follow, теги по ID) проверяет workflow выкладки и ручная проверка после неё.

test('robots.txt тестовой сборки закрывает сайт; sitemap.xml — 7 индексируемых страниц', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Disallow: /');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(locs).toEqual(['/', '/kukhni', '/mebli', '/roboty', '/yak-my-stvoriuiemo', '/kontakty', '/polityka']);
});

test('каждая страница: canonical без .html, Open Graph 1200 × 630 своей картинкой; без тегов аналитики в тестовой сборке', async ({ page, request }) => {
  for (const [path, og] of [
    ['/', 'home'],
    ['/kukhni', 'kukhni'],
    ['/mebli', 'mebli'],
    ['/roboty', 'roboty'],
    ['/kontakty', 'kontakty'],
    ['/polityka', 'polityka'],
    ['/yak-my-stvoriuiemo', 'yak-my-stvoriuiemo'],
  ] as const) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]'), path).toHaveAttribute('href', new RegExp(`${path === '/' ? '/' : path}$`));
    const img = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(img, path).toMatch(new RegExp(`/og/${og}\\.jpg$`));
    expect((await request.get(new URL(img!).pathname)).status(), img!).toBe(200);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', await page.title());
    await expect(page.locator('script[src*="googletagmanager"], script:has-text("fbq(")')).toHaveCount(0);
    await expect(page.locator('meta[name="google-site-verification"]')).toHaveCount(0);
  }
});

test('JSON-LD: LocalBusiness на индексируемых страницах, FAQPage на посадочных; на noindex-страницах схем нет', async ({ page }) => {
  const schemas = async (path: string) => {
    await page.goto(path);
    return page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? '{}')));
  };
  const home = await schemas('/');
  expect(home.map((s) => s['@type'])).toEqual(['LocalBusiness']);
  expect(home[0]).toMatchObject({
    name: 'Вимір',
    telephone: '+380759914883',
    address: { addressLocality: 'Черкаси' },
    areaServed: { name: 'Черкаська область' },
    sameAs: ['https://www.instagram.com/vymir.che', 'https://www.tiktok.com/@vymir.che'],
  });
  const kukhni = await schemas('/kukhni');
  expect(kukhni.map((s) => s['@type'])).toEqual(['LocalBusiness', 'FAQPage']);
  expect(kukhni[1].mainEntity).toHaveLength(6);
  expect(await schemas('/dyakuyemo')).toEqual([]);
});

test('noindex всегда: «Дякуємо», 404', async ({ page }) => {
  for (const path of ['/dyakuyemo', '/takoi-storinky-nemaie']) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute('content', /noindex/);
  }
});

test('аналитика: Lead и generate_lead уходят без имени и телефона; клик по телефону и Viber — click_phone / click_messenger и Contact', async ({ page }) => {
  // В тестовой сборке тегов нет — подставляем gtag и fbq, как их подключил бы Analytics.astro в боевой сборке
  await page.addInitScript(() => {
    const save = (k: string, v: unknown) => {
      const list = JSON.parse(sessionStorage.getItem(k) ?? '[]');
      list.push(v);
      sessionStorage.setItem(k, JSON.stringify(list));
    };
    const w = window as unknown as { gtag: (...a: unknown[]) => void; fbq: (...a: unknown[]) => void };
    w.gtag = (...a: unknown[]) => save('t.gtag', a);
    w.fbq = (...a: unknown[]) => save('t.fbq', a);
  });
  await page.goto('/kukhni#kvyz');
  await expect(page.locator('[data-quiz]')).toHaveAttribute('data-ready', '');
  const step = page.locator('[data-quiz] [data-step]:not([hidden])');
  for (const l of ['Кутова', '3–4 м', 'ДСП', 'Пізніше']) await step.getByRole('radio', { name: l, exact: true }).click();
  await page.locator('#quiz-name').fill('Олена');
  await page.locator('#quiz-phone').click();
  await page.locator('#quiz-phone').pressSequentially('0671234567');
  await page.locator('#quiz-consent').check();
  await step.getByRole('button', { name: 'Отримати ціну' }).click();
  await expect(page).toHaveURL(/\/dyakuyemo$/);
  const gtag = await page.evaluate(() => JSON.parse(sessionStorage.getItem('t.gtag') ?? '[]') as unknown[][]);
  const fbq = await page.evaluate(() => JSON.parse(sessionStorage.getItem('t.fbq') ?? '[]') as unknown[][]);
  const names = gtag.map((g) => g[1]);
  expect(names).toContain('quiz_step');
  expect(gtag.filter((g) => g[1] === 'quiz_step').map((g) => (g[2] as { step: number }).step)).toEqual([2, 3, 4, 6, 7]);
  expect(gtag.find((g) => g[1] === 'generate_lead')).toEqual(['event', 'generate_lead', { form_type: 'quiz', page: '/kukhni' }]);
  expect(fbq).toContainEqual(['track', 'Lead', { content_name: 'quiz_kukhni' }]);
  const dump = JSON.stringify([gtag, fbq]);
  expect(dump).not.toMatch(/Олена|671234567|\+380/);

  await page.locator('[data-bottom-bar] a[href^="tel:"], [data-header] a[href^="tel:"]').first().evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
  await page.locator('main a[href^="viber:"]').first().evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
  await page.locator('main a[href^="tel:"]').first().evaluate((a) => a.addEventListener('click', (e) => e.preventDefault()));
  await page.locator('main a[href^="tel:"]').first().click();
  await page.locator('main a[href^="viber:"]').first().click();
  const after = await page.evaluate(() => JSON.parse(sessionStorage.getItem('t.gtag') ?? '[]') as unknown[][]);
  expect(after).toContainEqual(['event', 'click_phone', { page: '/dyakuyemo' }]);
  expect(after).toContainEqual(['event', 'click_messenger', { messenger: 'viber', page: '/dyakuyemo' }]);
  const fb2 = await page.evaluate(() => JSON.parse(sessionStorage.getItem('t.fbq') ?? '[]') as unknown[][]);
  expect(fb2.filter((f) => f[1] === 'Contact')).toHaveLength(2);
});
