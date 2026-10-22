import { expect, test } from './fixtures';
import { yellowOnScreen } from './helpers';

// Внутренние страницы (ТЗ): «Меблі», «Контакти», «Політика конфіденційності», 404 — и ни одной битой ссылки
const PAGES = ['/', '/kukhni', '/mebli', '/roboty', '/kontakty', '/polityka', '/yak-my-stvoriuiemo', '/dyakuyemo', '/404', '/planuvannya', '/planuvannya-mebli'];

test('все внутренние ссылки со всех страниц ведут на существующие страницы', async ({ page, request }) => {
  const links = new Set<string>();
  for (const path of PAGES) {
    await page.goto(path);
    for (const href of await page.locator('a[href^="/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')!))) {
      links.add(href.split('#')[0].split('?')[0] || '/');
    }
  }
  expect(links.size).toBeGreaterThan(5);
  for (const href of links) {
    const res = await request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test('галочка согласия во всех формах ведёт на существующую политику', async ({ page, request }) => {
  await page.goto('/kukhni');
  const hrefs = await page.locator('.consent__label a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(new Set(hrefs)).toEqual(new Set(['/polityka']));
  expect((await request.get('/polityka')).status()).toBe(200);
});

test.describe('/polityka', () => {
  test('разделы политики; владелец — ФОП Мєшалкін Андрій Леонідович, контакт vymir.che@gmail.com и телефон; GA4 и Pixel', async ({ page }) => {
    await page.goto('/polityka');
    await expect(page.locator('h1')).toHaveText('Політика конфіденційності');
    await expect(page.locator('article h2')).toHaveText([
      'Хто обробляє дані',
      'Які дані ми отримуємо',
      'Навіщо',
      'Підстава',
      'Де зберігаються дані і хто має доступ',
      'Скільки зберігаємо',
      'Дані у вашому браузері',
      'Аналітика: Google Analytics і Meta Pixel',
      'Ваші права',
      'Зміни політики',
    ]);
    await expect(page.locator('main')).toContainText('Про захист персональних даних');
    await expect(page.locator('main')).toContainText('Володілець персональних даних — ФОП Мєшалкін Андрій Леонідович');
    await expect(page.locator('main a[href="tel:+380759914843"]')).toHaveCount(1);
    // заглушек больше нет: почта для вопросов о персональных данных подтверждена 2026-10-22
    await expect(page.locator('.fact-ph')).toHaveCount(0);
    await expect(page.locator('main a[href="mailto:vymir.che@gmail.com"]').first()).toHaveText('vymir.che@gmail.com');
    await expect(page.locator('main')).toContainText('Ваше ім’я, номер телефону, опис завдання і файли в Google Analytics і Meta Pixel не передаються ніколи');
    await expect(page.locator('main a[href="https://tools.google.com/dlpage/gaoptout"]')).toHaveCount(1);
  });
});

test.describe('/kontakty', () => {
  test('крупные кнопки: телефон, Viber, Telegram, Instagram, TikTok; зона виїзду; форма «Нестандартне завдання»; без фактов — без графіка, адреси, карти', async ({ page }) => {
    await page.goto('/kontakty');
    await expect(page.locator('h1')).toHaveText('Контакти');
    await expect(page.locator('main a.contacts__phone')).toContainText('+380 75 991 48 43');
    await expect(page.locator('main').getByRole('link', { name: 'Подзвонити' })).toHaveAttribute('href', 'tel:+380759914843');
    await expect(page.locator('main').getByRole('link', { name: 'Viber' })).toHaveAttribute('href', 'viber://chat?number=%2B380759914843');
    await expect(page.locator('main').getByRole('link', { name: 'Telegram' })).toHaveAttribute('href', 'https://t.me/+380759914843');
    await expect(page.locator('main').getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', 'https://www.instagram.com/vymir.che');
    await expect(page.locator('main').getByRole('link', { name: 'TikTok' })).toHaveAttribute('href', 'https://www.tiktok.com/@vymir.che');
    await expect(page.locator('main')).not.toContainText(/Графік|Адреса|Пошта/);
    await expect(page.locator('main .ph, main .fact-ph')).toHaveCount(0);
    await expect(page.locator('main')).toContainText('Черкаси та область');
    await expect(page.locator('main #zapyt form')).toHaveCount(1);
    await expect(page.locator('#zapyt-referrer')).toHaveCount(1);
  });
});

test.describe('404', () => {
  test('несуществующий адрес: «Сторінку не знайдено», кнопки на главную и в квиз, noindex', async ({ page }) => {
    const res = await page.goto('/takoi-storinky-nemaie');
    expect(res!.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Сторінку не знайдено');
    await expect(page.locator('main').getByRole('link', { name: 'На головну' })).toHaveAttribute('href', '/');
    await expect(page.locator('main').getByRole('link', { name: 'Порахувати вартість' })).toHaveAttribute('href', '/kukhni#kvyz');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test('на новых страницах не больше одного жёлтого элемента на экране', async ({ page }) => {
  for (const path of ['/', '/mebli', '/kontakty', '/polityka', '/404', '/roboty', '/dyakuyemo']) {
    await page.goto(path);
    await page.waitForTimeout(100);
    const yellow = await yellowOnScreen(page);
    expect(yellow.length, `${path}: ${yellow.join(' | ')}`).toBeLessThanOrEqual(1);
  }
});

test('режим запуска: ни одной плашки-заглушки и пустого места под фото на страницах (кроме ФОП и почты в политике)', async ({ page }) => {
  for (const path of ['/', '/kukhni', '/mebli', '/roboty', '/kontakty', '/yak-my-stvoriuiemo', '/dyakuyemo', '/404']) {
    await page.goto(path);
    await expect(page.locator('.fact-ph'), path).toHaveCount(0);
    await expect(page.locator('main .ph:visible'), path).toHaveCount(0);
    expect(await page.locator('body').innerText(), path).not.toMatch(/\{\{|undefined|\[object Object\]/);
  }
});

test('телефон +380 75 991 48 43 и ссылки tel / Viber / Telegram: шапка, нижняя панель, подвал, /dyakuyemo', async ({ page, isMobile }) => {
  await page.goto('/kukhni');
  if (isMobile) {
    await expect(page.locator('[data-bottom-bar] a[href="tel:+380759914843"]')).toHaveCount(1);
    await expect(page.locator('[data-bottom-bar] a[href="viber://chat?number=%2B380759914843"]')).toHaveCount(1);
  } else {
    await expect(page.locator('[data-header] a[href="tel:+380759914843"]').first()).toContainText('+380 75 991 48 43');
  }
  await expect(page.locator('footer a[href="tel:+380759914843"]:visible')).toHaveCount(1);
  await page.goto('/dyakuyemo');
  await expect(page.locator('main a[href="tel:+380759914843"]')).toHaveCount(1);
  await expect(page.locator('main a[href="viber://chat?number=%2B380759914843"]')).toHaveCount(1);
  await expect(page.locator('main a[href="https://www.instagram.com/vymir.che"]')).toHaveCount(1);
  await expect(page.locator('main a[href="https://www.tiktok.com/@vymir.che"]')).toHaveCount(1);
});

test('ФОП — только в политике, больше нигде', async ({ page }) => {
  for (const path of ['/', '/kukhni', '/mebli', '/roboty', '/kontakty', '/yak-my-stvoriuiemo', '/dyakuyemo', '/404']) {
    await page.goto(path);
    expect(await page.locator('body').innerText(), path).not.toMatch(/ФОП|Мєшалкін/);
  }
});
