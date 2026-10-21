import { expect, test } from '@playwright/test';
import { yellowOnScreen } from './helpers';

// Внутренние страницы (ТЗ): «Меблі», «Контакти», «Політика конфіденційності», 404 — и ни одной битой ссылки
const PAGES = ['/', '/roboty', '/mebli', '/kontakty', '/polityka', '/yak-my-stvoriuiemo', '/dyakuyemo'];

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
  await page.goto('/');
  const hrefs = await page.locator('.consent__label a').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  expect(new Set(hrefs)).toEqual(new Set(['/polityka']));
  expect((await request.get('/polityka')).status()).toBe(200);
});

test.describe('/polityka', () => {
  test('разделы политики; без реквизитов ФОП; контакт для запросов — заглушка', async ({ page }) => {
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
      'Ваші права',
      'Зміни політики',
    ]);
    await expect(page.locator('main')).toContainText('Про захист персональних даних');
    await expect(page.locator('main')).not.toContainText(/ФОП|РНОКПП|ІПН/);
    for (const name of ['PRIVACY_CONTACT_EMAIL', 'PRIVACY_UPDATED_AT', 'PRIVACY_RETENTION']) {
      await expect(page.locator(`[data-placeholder="${name}"]`).first()).toBeVisible();
    }
  });
});

test.describe('/kontakty', () => {
  test('телефон, месенджери, графік, зона виїзду, коротка форма', async ({ page }) => {
    await page.goto('/kontakty');
    await expect(page.locator('h1')).toHaveText('Контакти');
    await expect(page.locator('main a[href^="tel:"]')).toHaveCount(1);
    for (const name of ['Viber', 'Telegram', 'Instagram']) await expect(page.locator('main').getByRole('link', { name })).toBeVisible();
    await expect(page.locator('main')).toContainText('Графік');
    await expect(page.locator('main')).toContainText('Черкаси та область');
    await expect(page.locator('main form[data-zamir-form]')).toHaveCount(1);
    await expect(page.locator('#kontakty-referrer')).toHaveCount(1);
  });
});

test.describe('/mebli', () => {
  test('первый экран с фото, работы, «Скільки коштує» без цен, форма; квиз — сразу ветка шафы', async ({ page }) => {
    await page.goto('/mebli');
    await expect(page.locator('h1')).toHaveText('Шафи та меблі на замовлення в Черкасах');
    await expect(page.locator('.mebli-hero__media img')).toHaveAttribute('src', /\/portfolio\/img\/shafy\//);
    await expect(page.locator('main [data-pf-grid] .pf__item')).toHaveCount(6);
    await expect(page.locator('main')).not.toContainText(/грн|кухні,/);
    await expect(page.locator('main').getByRole('link', { name: 'Розрахувати вартість' }).first()).toHaveAttribute('href', '/?kvyz=shafa#kvyz');
    await expect(page.locator('main form[data-zamir-form]')).toHaveCount(1);
  });

  test('кнопка «Розрахувати» открывает квиз с заранее выбранной «Шафа або гардеробна» (путь 5 шагов)', async ({ page }) => {
    await page.goto('/mebli');
    await page.locator('.mebli-hero').getByRole('link', { name: 'Розрахувати вартість' }).click();
    await expect(page).toHaveURL(/\?kvyz=shafa#kvyz$/);
    await expect(page.locator('[data-quiz]')).toHaveAttribute('data-ready', '');
    await expect(page.locator('[data-quiz] [data-quiz-progress-text]')).toHaveText('Крок 1 з 5');
    await expect(page.locator('[data-step="goal"] [data-value="wardrobe"]')).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('404', () => {
  test('несуществующий адрес: «Сторінку не знайдено», кнопки на главную и в квиз, noindex', async ({ page }) => {
    const res = await page.goto('/takoi-storinky-nemaie');
    expect(res!.status()).toBe(404);
    await expect(page.locator('h1')).toHaveText('Сторінку не знайдено');
    await expect(page.locator('main').getByRole('link', { name: 'На головну' })).toHaveAttribute('href', '/');
    await expect(page.locator('main').getByRole('link', { name: 'Розрахувати вартість' })).toHaveAttribute('href', '/#kvyz');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test('на новых страницах не больше одного жёлтого элемента на экране', async ({ page }) => {
  for (const path of ['/mebli', '/kontakty', '/polityka', '/404', '/roboty']) {
    await page.goto(path);
    await page.waitForTimeout(100);
    const yellow = await yellowOnScreen(page);
    expect(yellow.length, `${path}: ${yellow.join(' | ')}`).toBeLessThanOrEqual(1);
  }
});
