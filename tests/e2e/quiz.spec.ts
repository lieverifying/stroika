import { expect, test, type Page } from './fixtures';
import { noTransitions, yellowOnScreen } from './helpers';

// Квиз (блок 5). Варианты выбираются нажатием, без кнопки «Далі».

const quiz = (page: Page) => page.locator('[data-quiz]');
const visibleStep = (page: Page) => quiz(page).locator('[data-step]:not([hidden])');
const progressText = (page: Page) => quiz(page).locator('[data-quiz-progress-text]');

/** Квиз на /kukhni открывается сразу с формы кухни; для проверок шага 1 возвращаемся «Назад» (step1 = true) */
async function openQuiz(page: Page, path = '/kukhni#kvyz', step1 = true) {
  await page.goto(path);
  await expect(quiz(page)).toHaveAttribute('data-ready', '');
  if (step1 && (await quiz(page).locator('[data-quiz-back]').isVisible())) {
    await quiz(page).locator('[data-quiz-back]').click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
  }
}

async function choose(page: Page, label: string | RegExp) {
  await visibleStep(page).getByRole('radio', { name: label }).click();
}

test.describe('квиз: переходы, «Назад», восстановление', () => {
  test('без сохранённых ответов кнопки «Продовжити» нет; виден только шаг 1', async ({ page }) => {
    await openQuiz(page);
    await expect(quiz(page).getByRole('button', { name: 'Продовжити, де зупинились' })).toBeHidden();
    await expect(quiz(page).locator('[data-step]:visible')).toHaveCount(1);
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
  });

  test('ветка кухни (ТЗ v2): форма → довжина → фасади → коли → контакт, прогресс 1/6 … 6/6', async ({ page }) => {
    await openQuiz(page);
    await expect(progressText(page)).toHaveText('Крок 1 з 6');
    await choose(page, 'Кухня');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await expect(progressText(page)).toHaveText('Крок 2 з 6');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['Пряма', 'Кутова', 'П-подібна', 'З островом']);
    await choose(page, 'Кутова');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['До 3 м', '3–4 м', '4–5 м', 'Більше 5 м', 'Не знаю — заміряємо']);
    await choose(page, '3–4 м');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['МДФ у плівці', 'Фарбований МДФ', 'ДСП', 'Акрил', 'HPL', 'Порадьте']);
    await choose(page, 'Фарбований МДФ');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'timing');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['Протягом 3 місяців', 'Через 3–6 місяців', 'Пізніше', 'Ще не знаю']);
    await choose(page, 'Через 3–6 місяців');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'contact');
    await expect(progressText(page)).toHaveText('Крок 6 з 6');
  });

  test('шафа (ТЗ v2): тип → ширина → коли → контакт, прогресс 2/5', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await expect(progressText(page)).toHaveText('Крок 2 з 5');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'wardrobeType');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['Купе', 'Розпашна', 'Гардеробна']);
    await choose(page, 'Купе');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'wardrobeWidth');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['До 1,5 м', '1,5–2,5 м', 'Більше 2,5 м', 'Не знаю']);
  });

  test('інші меблі (ТЗ v2): що саме → коли → контакт, прогресс 2/4', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Інші меблі');
    await expect(progressText(page)).toHaveText('Крок 2 з 4');
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['Передпокій', 'Дитяча', 'Тумба у ванну', 'ТВ-зона', 'Меблі для бізнесу', 'Інше']);
    await choose(page, 'Тумба у ванну');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'timing');
    await choose(page, 'Пізніше');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'contact');
  });

  test('«Назад» дважды — выбранный ответ подсвечен; на шаге 1 «Назад» скрыт', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Кухня');
    await choose(page, 'Пряма');
    await choose(page, '4–5 м');
    const backBtn = quiz(page).locator('[data-quiz-back]');
    await backBtn.click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenLength');
    await expect(visibleStep(page).getByRole('radio', { name: '4–5 м' })).toHaveAttribute('aria-checked', 'true');
    await backBtn.click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await expect(visibleStep(page).getByRole('radio', { name: 'Пряма' })).toHaveAttribute('aria-checked', 'true');
    await backBtn.click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
    await expect(backBtn).toBeHidden();
  });

  test('перезагрузка: квиз с начала (на /kukhni — форма кухни) с кнопкой «Продовжити, де зупинились» — она возвращает на тот же шаг', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Кухня');
    await choose(page, 'П-подібна');
    await choose(page, 'Більше 5 м');
    await page.reload();
    await expect(quiz(page)).toHaveAttribute('data-ready', '');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await expect(quiz(page).locator('#quiz-name')).toBeHidden(); // поля контакта — только на последнем шаге
    const resume = quiz(page).getByRole('button', { name: 'Продовжити, де зупинились' });
    await expect(resume).toBeVisible();
    await resume.click();
    await expect(resume).toBeHidden();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'facade');
    await expect(progressText(page)).toHaveText('Крок 4 з 6');
    // имя и телефон в хранилище не попадают — их там и нет: только ответы
    const saved = await page.evaluate(() => localStorage.getItem('vymir.quiz.v1') ?? '');
    expect(saved).toContain('"kitchenShape":"p-podibna"');
  });

  test('кнопка браузера «назад» листает шаги, а не уводит со страницы', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Кухня');
    await choose(page, 'Кутова');
    await page.goBack();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await page.goBack();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
    await expect(page).toHaveURL(/\/kukhni#kvyz$/);
  });

  test('/?kvyz=shafa#kvyz заранее выбирает шафу', async ({ page }) => {
    await openQuiz(page, '/kukhni?kvyz=shafa#kvyz');
    await expect(visibleStep(page).getByRole('radio', { name: 'Шафа або гардеробна' })).toHaveAttribute('aria-checked', 'true');
    await expect(progressText(page)).toHaveText('Крок 1 з 5');
  });

  test('«Почати заново» сбрасывает ответы — к началу квиза этой посадочной (форма кухни, без выбора)', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await choose(page, 'Купе');
    await quiz(page).locator('[data-quiz-restart]').click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await expect(visibleStep(page).locator('[aria-checked="true"]')).toHaveCount(0);
    await expect(quiz(page).locator('[data-quiz-restart]')).toBeHidden();
    await quiz(page).locator('[data-quiz-back]').click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
    await expect(visibleStep(page).getByRole('radio', { name: 'Шафа або гардеробна' })).toHaveAttribute('aria-checked', 'false');
  });

  test('клавиатура: стрелки двигают фокус по вариантам, Enter выбирает', async ({ page }) => {
    await openQuiz(page);
    const first = visibleStep(page).getByRole('radio').first();
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(visibleStep(page).getByRole('radio', { name: 'Шафа або гардеробна' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'wardrobeType');
    await expect(visibleStep(page).locator('h3')).toBeFocused();
  });
});

test.describe('квиз: шаг контакта', () => {
  async function toContact(page: Page) {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await choose(page, 'Купе');
    await choose(page, 'Не знаю');
    await choose(page, 'Пізніше');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'contact');
  }

  test('пустая отправка, неполный номер, нет согласия — отправка блокируется с понятными ошибками', async ({ page }) => {
    await toContact(page);
    const step = visibleStep(page);
    // способ связи — первым, порядок Viber · Telegram · Дзвінок, по умолчанию Viber
    await expect(step.getByRole('heading', { name: 'Куди надіслати розрахунок?' })).toBeVisible();
    await expect(step.locator('input[name="method"]')).toHaveCount(3);
    expect(await step.locator('input[name="method"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual([
      'viber',
      'telegram',
      'call',
    ]);
    await expect(step.getByRole('radio', { name: 'Viber' })).toBeChecked();
    const firstField = await step.locator('form input:not([type="hidden"])').first().getAttribute('name');
    expect(firstField).toBe('method');
    await expect(step.locator('#quiz-referrer')).toBeVisible(); // «Хто вас порекомендував?» — необязательно
    await expect(step.locator('#quiz-consent')).not.toBeChecked();
    const submit = step.getByRole('button', { name: 'Отримати ціну' });
    await submit.click();
    await expect(page.locator('#quiz-name')).toBeFocused();
    await expect(page.locator('#quiz-name-error')).toBeVisible();
    await expect(page.locator('#quiz-phone-error')).toBeVisible();
    await expect(page.locator('#quiz-consent-error')).toBeVisible();

    await page.locator('#quiz-name').fill('Олена');
    await page.locator('#quiz-phone').click();
    await page.locator('#quiz-phone').pressSequentially('067123');
    await submit.click();
    await expect(page.locator('#quiz-name-error')).toBeHidden();
    await expect(page.locator('#quiz-phone')).toBeFocused();
    await expect(page.locator('#quiz-phone-error')).toContainText('+380');
    await expect(page.locator('#quiz-consent-error')).toBeVisible();
  });

  test('телефон: при фокусе в поле контакта нижняя панель скрыта, кнопка видна', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await toContact(page);
    await page.locator('#quiz-phone').focus();
    await expect(page.locator('[data-bottom-bar]')).toHaveAttribute('data-hidden', '');
    const submit = visibleStep(page).getByRole('button', { name: 'Отримати ціну' });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
  });

  test('шаг 1: четыре варианта, ремонта нет', async ({ page }) => {
    await openQuiz(page);
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['Кухня', 'Шафа або гардеробна', 'Інші меблі', 'Інше, нестандартне']);
  });

  test('«Інше, нестандартне» ведёт на /kontakty#zapyt, этот выбор квиз не сохраняет', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Інше, нестандартне');
    await expect(page).toHaveURL(/\/kontakty#zapyt$/);
    await expect(page.locator('#zapyt-title')).toBeInViewport();
    expect(await page.evaluate(() => localStorage.getItem('vymir.quiz.v1') ?? '')).not.toContain('custom');
  });

  test('шаг сроков: «Протягом 3 місяців» вместо «до Нового року»', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Інші меблі');
    await choose(page, 'Дитяча');
    await expect(visibleStep(page).getByRole('radio').first()).toHaveText('Протягом 3 місяців');
    await expect(visibleStep(page)).not.toContainText('Нового року');
  });
});

test.describe('квиз: отправка и /dyakuyemo', () => {
  test('ветка шафы до конца → одна заявка в api/lead.php, /dyakuyemo, экран Б (флаг B), квиз очищен', async ({ page, leadApi }) => {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await choose(page, 'Гардеробна');
    await choose(page, '1,5–2,5 м');
    await choose(page, 'Через 3–6 місяців');
    await page.locator('#quiz-name').fill('Олена');
    await page.locator('#quiz-phone').click();
    await page.locator('#quiz-phone').pressSequentially('0671234567');
    await page.locator('#quiz-consent').check();
    await visibleStep(page).getByRole('button', { name: 'Отримати ціну' }).click();
    await expect(page).toHaveURL(/\/dyakuyemo$/);
    await expect(page.locator('[data-quiz-result]')).toHaveAttribute('data-shown', 'B');
    await expect(page.locator('[data-thanks]')).toHaveText(/^Дякуємо, Олена\. Надішлемо розрахунок у Viber у робочий час\.$/);
    await expect(page.locator('[data-result="A"]')).toBeHidden(); // экран А (цена) выключен
    // при флаге B причина всегда variant-b: строка «no-length» (только для отката с флага A) скрыта
    await expect(page.locator('[data-result="B"] [data-no-length]')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('vymir.quiz.v1'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('vymir.lead.thanks'))).toBeNull(); // удалён после показа
    expect(leadApi.leads).toHaveLength(1);
    const lead = leadApi.leads[0];
    // способ связи — первым полем; ответы квиза текстом для Telegram и таблицы
    expect(Object.keys(lead)[0]).toBe('contactMethod');
    expect(lead).toMatchObject({
      contactMethod: 'viber',
      form: 'quiz',
      name: 'Олена',
      phone: '+380671234567',
      consent: true,
      page: '/kukhni',
      landing: 'kukhni',
      quiz: { summary: 'Шафа або гардеробна · Гардеробна · 1,5–2,5 м · Через 3–6 місяців', branch: 'wardrobe', timing: 'Через 3–6 місяців' },
    });
    expect(String(lead.eventId)).toMatch(/.{8,}/);
  });

  test('сервер не принял заявку → текст ошибки и прямые кнопки связи, ответы и поля на месте', async ({ page, leadApi }) => {
    leadApi.status = 502;
    await openQuiz(page);
    await choose(page, 'Інші меблі');
    await choose(page, 'Передпокій');
    await choose(page, 'Пізніше');
    await page.locator('#quiz-name').fill('Олена');
    await page.locator('#quiz-phone').click();
    await page.locator('#quiz-phone').pressSequentially('0671234567');
    await page.locator('#quiz-consent').check();
    const submit = visibleStep(page).getByRole('button', { name: 'Отримати ціну' });
    await submit.click();
    const status = visibleStep(page).locator('[data-form-status]');
    await expect(status).toContainText('Не вдалося надіслати. Подзвоніть або напишіть нам', { timeout: 8000 });
    await expect(status.getByRole('link', { name: 'Подзвонити' })).toHaveAttribute('href', 'tel:+380759914843');
    await expect(status.getByRole('link', { name: 'Viber' })).toHaveAttribute('href', 'viber://chat?number=%2B380759914843');
    await expect(status.getByRole('link', { name: 'Telegram' })).toHaveAttribute('href', 'https://t.me/+380759914843');
    await expect(page).toHaveURL(/\/kukhni#kvyz$/);
    await expect(page.locator('#quiz-name')).toHaveValue('Олена');
    await expect(submit).toBeEnabled();
    expect(leadApi.leads).toHaveLength(2); // первая попытка + один повтор через 2 с
  });

  test('способ «Дзвінок» → «Зателефонуємо…», Telegram → «Надішлемо розрахунок у Telegram»', async ({ page }) => {
    for (const [method, text] of [
      ['Дзвінок', /^Дякуємо, Олена\. Зателефонуємо у робочий час\.$/],
      ['Telegram', /^Дякуємо, Олена\. Надішлемо розрахунок у Telegram у робочий час\.$/],
    ] as const) {
      await openQuiz(page);
      await choose(page, 'Інші меблі');
      await choose(page, 'Тумба у ванну');
      await choose(page, 'Ще не знаю');
      await visibleStep(page).getByRole('radio', { name: method }).check();
      await page.locator('#quiz-name').fill('Олена');
      await page.locator('#quiz-phone').click();
      await page.locator('#quiz-phone').pressSequentially('0671234567');
      await page.locator('#quiz-consent').check();
      await visibleStep(page).getByRole('button', { name: 'Отримати ціну' }).click();
      await expect(page).toHaveURL(/\/dyakuyemo$/);
      await expect(page.locator('[data-thanks]')).toHaveText(text);
    }
  });

  test('/dyakuyemo без данных квиза — общий текст; разметки цены нет ни с JS, ни без него (флаг B)', async ({ page, browser }) => {
    await page.goto('/dyakuyemo');
    await expect(page.locator('[data-quiz-result]')).toHaveAttribute('data-shown', 'generic');
    await expect(page.locator('[data-thanks]')).toHaveText(/^Дякуємо\. Зателефонуємо у робочий час\.$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expect(page.locator('[data-result="A"]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/Орієнтовна вартість|грн/);
    await page.goto('/dyakuyemo?demoPrice=1');
    await expect(page.locator('[data-result="A"]')).toHaveCount(0);
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const noJs = await ctx.newPage();
    await noJs.goto('/dyakuyemo');
    await expect(noJs.locator('main')).not.toContainText(/Орієнтовна вартість|грн|від\s+до/);
    await ctx.close();
  });

  test('посадочные: шаг 1 пропущен — /kukhni с формы кухни (2 з 6), /mebli с типа шафы (2 з 5); «Назад» — на шаг 1', async ({ page }) => {
    await openQuiz(page, '/kukhni#kvyz', false);
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await expect(visibleStep(page).locator('h3')).toHaveText('Яка форма кухні?');
    await expect(progressText(page)).toHaveText('Крок 2 з 6');
    await expect(quiz(page).locator('[data-quiz-restart]')).toBeHidden();
    await quiz(page).locator('[data-quiz-back]').click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
    await expect(visibleStep(page).getByRole('radio', { name: 'Кухня' })).toHaveAttribute('aria-checked', 'true');
    await openQuiz(page, '/mebli#kvyz', false);
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'wardrobeType');
    await expect(visibleStep(page).locator('h3')).toHaveText('Що саме потрібно?');
    await expect(progressText(page)).toHaveText('Крок 2 з 5');
  });
});

test('события: ветка шафы — ровно quiz_start, quiz_step_1/2/3/6/7; «Назад» не дублирует; без имени и телефона', async ({ page }) => {
  // dataLayer пропадает при переходе на /dyakuyemo — копируем события в sessionStorage
  await page.addInitScript(() => {
    const w = window as unknown as { dataLayer: unknown[] };
    const saved = JSON.parse(sessionStorage.getItem('test.dl') ?? '[]');
    w.dataLayer = [];
    const push = w.dataLayer.push.bind(w.dataLayer);
    w.dataLayer.push = (...items: unknown[]) => {
      saved.push(...items);
      sessionStorage.setItem('test.dl', JSON.stringify(saved));
      return push(...items);
    };
  });
  await openQuiz(page);
  await choose(page, 'Шафа або гардеробна');
  await choose(page, 'Розпашна');
  await quiz(page).locator('[data-quiz-back]').click();
  await choose(page, 'Купе'); // повторный выбор шага 2 — без нового quiz_step_2
  await choose(page, 'Більше 2,5 м');
  await choose(page, 'Пізніше');
  await page.locator('#quiz-name').fill('Олена');
  await page.locator('#quiz-phone').click();
  await page.locator('#quiz-phone').pressSequentially('0671234567');
  await page.locator('#quiz-consent').check();
  await visibleStep(page).getByRole('button', { name: 'Отримати ціну' }).click();
  await expect(page).toHaveURL(/\/dyakuyemo$/);
  const events = (await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.dl') ?? '[]') as { event: string }[])).filter((e) =>
    e.event.startsWith('quiz_'),
  );
  expect(events.map((e) => e.event)).toEqual(['quiz_start', 'quiz_step_1', 'quiz_step_2', 'quiz_step_3', 'quiz_step_6', 'quiz_step_7']);
  const dump = JSON.stringify(events);
  expect(dump).not.toContain('Олена');
  expect(dump).not.toMatch(/671234567|phone|name/);
  expect(events.every((e) => (e as Record<string, unknown>).quiz_branch === 'wardrobe')).toBe(true);
});

test.describe('квиз за 60 секунд (критерий фазы 4)', () => {
  // Человек думает над вопросом 2–3 с — это имитация пользователя, а не ожидание загрузки страницы.
  const THINK_MS = 2500;
  const think = (page: Page) => page.waitForTimeout(THINK_MS);

  test('ветка кухни от первого нажатия до /dyakuyemo ≤ 60 с; на каждом шаге ≤ 1 жёлтого и нет скролла вбок', async ({ page }, info) => {
    test.setTimeout(120_000);
    await openQuiz(page);
    await noTransitions(page);

    const checkScreen = async () => {
      const yellow = await yellowOnScreen(page);
      expect(yellow.length, `жёлтые: ${yellow.join(' | ')}`).toBeLessThanOrEqual(1);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    };

    const t0 = Date.now();
    for (const label of ['Кухня', 'Кутова', '3–4 м', 'Фарбований МДФ', 'Через 3–6 місяців']) {
      await checkScreen();
      await think(page);
      await choose(page, label);
    }
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'contact');
    await checkScreen();
    await think(page);
    await page.locator('#quiz-name').pressSequentially('Олена', { delay: 150 });
    await page.locator('#quiz-phone').click();
    await page.locator('#quiz-phone').pressSequentially('0671234567', { delay: 150 });
    await page.locator('#quiz-consent').check();
    await visibleStep(page).getByRole('button', { name: 'Отримати ціну' }).click();
    await expect(page).toHaveURL(/\/dyakuyemo$/);
    await expect(page.locator('[data-quiz-result]')).toHaveAttribute('data-shown', 'B');
    const seconds = (Date.now() - t0) / 1000;

    info.annotations.push({ type: 'Время прохождения ветки кухни', description: `${seconds.toFixed(1)} с (пауза на шаг ${THINK_MS / 1000} с)` });
    console.log(`⏱ [${info.project.name}] ветка кухни: ${seconds.toFixed(1)} с`);
    expect(seconds).toBeLessThanOrEqual(60);
  });
});

test('320 px: ни на одном шаге квиза страница не едет вбок', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'только телефон');
  await page.setViewportSize({ width: 320, height: 640 });
  const noOverflow = async () =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await openQuiz(page);
  for (const label of ['Кухня', 'З островом', 'Не знаю — заміряємо', 'Порадьте', 'Пізніше']) {
    await noOverflow();
    await choose(page, label);
  }
  await noOverflow(); // шаг контакта
  await quiz(page).locator('[data-quiz-restart]').click();
  await quiz(page).locator('[data-quiz-back]').click();
  await choose(page, 'Шафа або гардеробна');
  await choose(page, 'Гардеробна');
  await noOverflow(); // шаг ширины
  await quiz(page).locator('[data-quiz-restart]').click();
  await quiz(page).locator('[data-quiz-back]').click();
  await choose(page, 'Інші меблі');
  await noOverflow(); // «що саме»
});
