import { expect, test, type Page } from '@playwright/test';
import { noTransitions, yellowOnScreen } from './helpers';

// Квиз (блок 5). Варианты выбираются нажатием, без кнопки «Далі».

const quiz = (page: Page) => page.locator('[data-quiz]');
const visibleStep = (page: Page) => quiz(page).locator('[data-step]:not([hidden])');
const progressText = (page: Page) => quiz(page).locator('[data-quiz-progress-text]');

async function openQuiz(page: Page, path = '/#kvyz') {
  await page.goto(path);
  await expect(quiz(page)).toHaveAttribute('data-ready', '');
}

async function choose(page: Page, label: string | RegExp) {
  await visibleStep(page).getByRole('radio', { name: label }).click();
}

test.describe('квиз: переходы, «Назад», восстановление', () => {
  test('ветка кухни доходит до шага контакта, прогресс 1/7 … 7/7', async ({ page }) => {
    await openQuiz(page);
    await expect(progressText(page)).toHaveText('Крок 1 з 7');
    await choose(page, 'Кухня');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'kitchenShape');
    await expect(progressText(page)).toHaveText('Крок 2 з 7');
    await choose(page, 'Кутова');
    await choose(page, '3–4 м');
    await choose(page, 'Фарбований МДФ');
    await choose(page, 'Кварц або акрил');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'timing');
    await choose(page, 'Через 1–3 місяці');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'contact');
    await expect(progressText(page)).toHaveText('Крок 7 з 7');
  });

  test('шафа: прогресс 1/7 → 2/5', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await expect(progressText(page)).toHaveText('Крок 2 з 5');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'wardrobeType');
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

  test('перезагрузка страницы: квиз на том же шаге с тем же прогрессом', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Кухня');
    await choose(page, 'П-подібна');
    await choose(page, 'Більше 5 м');
    await page.reload();
    await expect(quiz(page)).toHaveAttribute('data-ready', '');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'facade');
    await expect(progressText(page)).toHaveText('Крок 4 з 7');
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
    await expect(page).toHaveURL(/\/#kvyz$/);
  });

  test('/?kvyz=shafa#kvyz заранее выбирает шафу', async ({ page }) => {
    await openQuiz(page, '/?kvyz=shafa#kvyz');
    await expect(visibleStep(page).getByRole('radio', { name: 'Шафа або гардеробна' })).toHaveAttribute('aria-checked', 'true');
    await expect(progressText(page)).toHaveText('Крок 1 з 5');
  });

  test('«Почати заново» сбрасывает ответы', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Кухня');
    await quiz(page).locator('[data-quiz-restart]').click();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
    await expect(visibleStep(page).getByRole('radio', { name: 'Кухня' })).toHaveAttribute('aria-checked', 'false');
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

test.describe('квиз: шаг контакта и коротка форма', () => {
  async function toContact(page: Page) {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await choose(page, 'Шафа-купе');
    await choose(page, 'Не знаю — приїдемо заміряти');
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

  test('«Інші меблі» ведёт на короткую форму 2 из 2, задача обязательна', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Інші меблі');
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'shortForm');
    await expect(progressText(page)).toHaveText('Крок 2 з 2');
    await visibleStep(page).getByRole('button', { name: 'Надіслати заявку' }).click();
    await expect(page.locator('#quiz-short-task')).toBeFocused();
    await expect(page.locator('#quiz-short-task-error')).toBeVisible();
  });

  test('шаг 1: четыре варианта, ремонта нет', async ({ page }) => {
    await openQuiz(page);
    await expect(visibleStep(page).getByRole('radio')).toHaveText(['Кухня', 'Шафа або гардеробна', 'Інші меблі', 'Інше, нестандартне']);
  });

  test('«Інше, нестандартне» ведёт в блок #zapyt, поле описания в фокусе, квиз остаётся на шаге 1', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Інше, нестандартне');
    await expect(page).toHaveURL(/#zapyt$/);
    await expect(page.locator('#zapyt-request')).toBeFocused();
    await expect(page.locator('#zapyt-title')).toBeInViewport();
    await expect(visibleStep(page)).toHaveAttribute('data-step', 'goal');
    expect(await page.evaluate(() => localStorage.getItem('vymir.quiz.v1'))).toBeNull();
  });

  test('шаг сроков: «Протягом 3 місяців» вместо «до Нового року»', async ({ page }) => {
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await choose(page, 'Шафа-купе');
    await choose(page, 'Не знаю — приїдемо заміряти');
    await expect(visibleStep(page).getByRole('radio').first()).toHaveText('Протягом 3 місяців');
    await expect(visibleStep(page)).not.toContainText('Нового року');
  });
});

test.describe('квиз: отправка и /dyakuyemo', () => {
  test('ветка шафы до конца → /dyakuyemo, экран Б (флаг B), квиз очищен, запросов в сеть нет', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET') posts.push(r.url());
    });
    await openQuiz(page);
    await choose(page, 'Шафа або гардеробна');
    await choose(page, 'Гардеробна');
    await choose(page, 'Не знаю — приїдемо заміряти');
    await choose(page, 'Через 1–3 місяці');
    await page.locator('#quiz-name').fill('Олена');
    await page.locator('#quiz-phone').click();
    await page.locator('#quiz-phone').pressSequentially('0671234567');
    await page.locator('#quiz-consent').check();
    await visibleStep(page).getByRole('button', { name: 'Отримати ціну' }).click();
    await expect(page).toHaveURL(/\/dyakuyemo$/);
    await expect(page.locator('[data-quiz-result]')).toHaveAttribute('data-shown', 'B');
    await expect(page.locator('[data-thanks]')).toHaveText(/^Дякуємо, Олена\. Надішлемо розрахунок у Viber протягом .+ хвилин у робочий час\.$/);
    await expect(page.locator('[data-result="A"]')).toBeHidden(); // экран А (цена) выключен
    // при флаге B причина всегда variant-b: строка «no-length» (только для отката с флага A) скрыта
    await expect(page.locator('[data-result="B"] [data-no-length]')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('vymir.quiz.v1'))).toBeNull();
    expect(await page.evaluate(() => sessionStorage.getItem('vymir.lead.thanks'))).toBeNull(); // удалён после показа
    expect(posts).toEqual([]);
  });

  test('способ «Дзвінок» → «Зателефонуємо…», Telegram → «Надішлемо розрахунок у Telegram»', async ({ page }) => {
    for (const [method, text] of [
      ['Дзвінок', /^Дякуємо, Олена\. Зателефонуємо протягом .+ хвилин у робочий час\.$/],
      ['Telegram', /^Дякуємо, Олена\. Надішлемо розрахунок у Telegram протягом .+ хвилин у робочий час\.$/],
    ] as const) {
      await openQuiz(page);
      await choose(page, 'Інші меблі');
      await page.locator('#quiz-short-task').fill('Тумба у ванну');
      await visibleStep(page).getByRole('radio', { name: method }).check();
      await page.locator('#quiz-short-name').fill('Олена');
      await page.locator('#quiz-short-phone').click();
      await page.locator('#quiz-short-phone').pressSequentially('0671234567');
      await page.locator('#quiz-short-consent').check();
      await visibleStep(page).getByRole('button', { name: 'Надіслати заявку' }).click();
      await expect(page).toHaveURL(/\/dyakuyemo$/);
      await expect(page.locator('[data-thanks]')).toHaveText(text);
    }
  });

  test('/dyakuyemo без данных квиза — общий текст; демо экрана А (?demoPrice=1, не в боевой сборке)', async ({ page }) => {
    await page.goto('/dyakuyemo');
    await expect(page.locator('[data-quiz-result]')).toHaveAttribute('data-shown', 'generic');
    await expect(page.locator('[data-thanks]')).toHaveText(/^Дякуємо\. Зателефонуємо протягом .+ хвилин у робочий час\.$/);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.goto('/dyakuyemo?demoPrice=1');
    await expect(page.locator('[data-quiz-result]')).toHaveAttribute('data-shown', 'A');
    await expect(page.locator('[data-result="A"]')).toContainText('грн');
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
  await choose(page, 'Розпашна шафа');
  await quiz(page).locator('[data-quiz-back]').click();
  await choose(page, 'Шафа-купе'); // повторный выбор шага 2 — без нового quiz_step_2
  await choose(page, 'Не знаю — приїдемо заміряти');
  await choose(page, 'Пізніше');
  await page.locator('#quiz-name').fill('Олена');
  await page.locator('#quiz-phone').click();
  await page.locator('#quiz-phone').pressSequentially('0671234567');
  await page.locator('#quiz-consent').check();
  await visibleStep(page).getByRole('button', { name: 'Отримати ціну' }).click();
  await expect(page).toHaveURL(/\/dyakuyemo$/);
  const events = await page.evaluate(() => JSON.parse(sessionStorage.getItem('test.dl') ?? '[]') as { event: string }[]);
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
    for (const label of ['Кухня', 'Кутова', '3–4 м', 'Фарбований МДФ', 'Кварц або акрил', 'Через 1–3 місяці']) {
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
  for (const label of ['Кухня', 'З островом', 'Не знаю — приїдемо заміряти', 'Порадьте', 'Ще не вирішили', 'Пізніше']) {
    await noOverflow();
    await choose(page, label);
  }
  await noOverflow(); // шаг контакта
  await quiz(page).locator('[data-quiz-restart]').click();
  await choose(page, 'Шафа або гардеробна');
  await choose(page, 'Гардеробна');
  await noOverflow(); // ширина с заглушками
  await quiz(page).locator('[data-quiz-restart]').click();
  await choose(page, 'Інші меблі');
  await noOverflow(); // коротка форма
});
