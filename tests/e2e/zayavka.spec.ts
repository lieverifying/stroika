import { test, expect, type Page } from './fixtures';

// Лендинг /zayavka (2026-11-03): проверка города, 5 шагов, заявка с бюджетом и проектом.
const pick = (page: Page, text: string) => page.locator('.z-option', { hasText: text }).click();
const step = (page: Page, id: string) => page.locator(`[data-step="${id}"]`);

async function fillContact(page: Page) {
  await page.locator('#z-district').fill('Митниця');
  await page.locator('#z-name').fill('Олена');
  await page.locator('#z-phone').fill('0671234567');
  await page.locator('#z-consent').check();
}

test('вся заявка: Черкаси → кухня → сумма → проект → материал → контакт', async ({ page, leadApi }) => {
  await page.goto('/zayavka');
  await expect(step(page, 'need')).toBeHidden();
  await pick(page, 'Черкаси');

  await expect(page.locator('[data-progress]')).toHaveText('Крок 1 з 5');
  // На телефоне заголовок сворачивается после входа, на десктопе остаётся
  if ((page.viewportSize()?.width ?? 0) < 1024) await expect(page.locator('h1')).toBeHidden();
  else await expect(page.locator('h1')).toBeVisible();
  await pick(page, 'Кухня');

  await expect(step(page, 'budget')).toBeVisible();
  await page.locator('[data-next]').click();
  await expect(page.locator('#z-budget-error')).toBeVisible();
  await page.locator('#z-budget').fill('150000');
  await expect(page.locator('#z-budget')).toHaveValue('150 000');
  await page.locator('[data-next]').click();

  await expect(page.locator('[data-project-files]')).toBeHidden();
  await pick(page, 'Так, є дизайн-проєкт');
  await expect(page.locator('[data-project-files]')).toBeVisible();
  await page.locator('#z-files').setInputFiles({ name: 'proekt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await page.locator('[data-next]').click();

  await pick(page, 'Акрил');
  await expect(page.locator('[data-progress]')).toHaveText('Крок 5 з 5');
  await fillContact(page);
  // Кнопка заявки становится жёлтой, когда видна на экране
  const submit = page.getByRole('button', { name: 'Надіслати заявку' });
  await submit.scrollIntoViewIfNeeded();
  await expect(submit).toHaveAttribute('data-cta-on', '');
  await submit.click();

  await expect(page).toHaveURL(/\/dyakuyemo$/);
  await expect(page.locator('[data-thanks]')).toContainText('Дякуємо, Олена. Напишемо вам у Viber');
  await expect(page.locator('body')).not.toContainText('розрахунок');

  expect(leadApi.leads).toHaveLength(1);
  expect(Object.keys(leadApi.leads[0])[0]).toBe('contactMethod');
  expect(leadApi.leads[0]).toMatchObject({
    form: 'zayavka',
    landing: 'zayavka',
    city: 'Черкаси',
    need: 'Кухня',
    budget: '150000',
    project: 'Є дизайн-проєкт',
    material: 'Акрил',
    district: 'Митниця',
    phone: '+380671234567',
    __files: ['proekt.pdf'],
  });
});

test('«Ще не знаю» и «Немає»: шаги идут дальше, бюджет пустой, файлов нет', async ({ page, leadApi }) => {
  await page.goto('/zayavka');
  await pick(page, 'Черкаси');
  await pick(page, 'Шафа або гардеробна');
  await page.getByRole('button', { name: 'Ще не знаю' }).click();
  await pick(page, 'Немає, зробіть безкоштовно');
  await pick(page, 'Порадьте');
  await fillContact(page);
  await page.getByRole('button', { name: 'Надіслати заявку' }).click();
  await expect(page).toHaveURL(/\/dyakuyemo$/);
  expect(leadApi.leads[0]).toMatchObject({ need: 'Шафа або гардеробна', budget: '', project: 'Немає', material: 'Порадьте' });
});

test('другой город: экран отказа, заявки нет, «Назад» возвращает к выбору', async ({ page, leadApi }) => {
  await page.goto('/zayavka');
  await pick(page, 'Інше місто');
  await expect(page.locator('[data-stop]')).toContainText('тільки в Черкасах');
  await expect(step(page, 'need')).toBeHidden();
  expect(leadApi.leads).toHaveLength(0);
  await page.locator('[data-stop-back]').click();
  await expect(step(page, 'city')).toBeVisible();
});

test('«Назад» с последнего шага и ошибки контакта', async ({ page, leadApi }) => {
  await page.goto('/zayavka');
  await pick(page, 'Черкаси');
  await pick(page, 'ТВ-зона');
  await page.getByRole('button', { name: 'Ще не знаю' }).click();
  await pick(page, 'Немає, зробіть безкоштовно');
  await pick(page, 'МДФ у плівці');
  await page.getByRole('button', { name: 'Надіслати заявку' }).click();
  await expect(page.locator('#z-name-error')).toBeVisible();
  expect(leadApi.leads).toHaveLength(0);
  await page.locator('[data-back]').click();
  await expect(step(page, 'material')).toBeVisible();
  // Повторное касание уже выбранного варианта тоже ведёт дальше
  await pick(page, 'МДФ у плівці');
  await expect(step(page, 'contact')).toBeVisible();
});

test('сбой отправки: ошибка на месте, можно отправить снова', async ({ page, leadApi }) => {
  leadApi.status = 502;
  await page.goto('/zayavka');
  await pick(page, 'Черкаси');
  await pick(page, 'Кухня');
  await page.getByRole('button', { name: 'Ще не знаю' }).click();
  await pick(page, 'Немає, зробіть безкоштовно');
  await pick(page, 'Порадьте');
  await fillContact(page);
  await page.getByRole('button', { name: 'Надіслати заявку' }).click();
  await expect(page).toHaveURL(/\/zayavka$/);
  await expect(page.getByRole('button', { name: 'Надіслати заявку' })).toBeEnabled();
});

test('без шапки и панели, noindex, нет горизонтальной прокрутки', async ({ page }) => {
  await page.goto('/zayavka');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('body')).toHaveClass(/is-bare/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.locator('body')).toContainText('Замір у Черкасах — безкоштовно');
  await expect(page.locator('[data-cta="primary"]')).toHaveCount(1);
});
