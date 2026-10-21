import { expect, test } from './fixtures';
import { yellowOnScreen } from './helpers';

// Сводное обновление 2026-10-20: факты бригады, квиз, блоки «Нестандартне завдання» и «Рекомендуйте нас»

test.describe('факты бригады на главной', () => {
  test('нет ремонта, «під ключ», демонтажа, электрики, сантехники, плитки и запрещённых слов', async ({ page }) => {
    await page.goto('/kukhni');
    const text = await page.locator('body').innerText();
    const meta = await page.locator('meta[name="description"]').getAttribute('content');
    for (const bad of [/ремонт/i, /під ключ/i, /демонтаж/i, /електрик/i, /сантехнік/i, /плитк/i, /шпон/i, /менеджер/i, /свій дизайнер/i, /Нового року/i]) {
      expect(text, String(bad)).not.toMatch(bad);
      expect(meta ?? '', String(bad)).not.toMatch(bad);
    }
    await expect(page.locator('a[href="/remont"]')).toHaveCount(0);
  });

  test('цен и сроков нет (решение владельца, 2026-10-21); зона — подтверждённый факт', async ({ page }) => {
    await page.goto('/kukhni');
    const main = page.locator('main');
    await expect(main).not.toContainText(/місяц[іья] від авансу|\d+\s*днів|від \d[\d\s]* грн/);
    await expect(main.locator('[data-placeholder^="PRICE_"], [data-placeholder^="TERM_"], [data-placeholder="PROMISE_MEASURE_3D_HOURS"]')).toHaveCount(0);
    await expect(page.locator('[data-block="12"]')).toContainText('Залежить від розмірів, матеріалів і наповнення.');
    await expect(page.locator('[data-block="12"]')).toContainText('Так, працюємо в Черкасах та області.');
    await expect(page.locator('[data-block="1"] .hero__badge')).toHaveCount(0); // сезонный бейдж выключен
    await expect(page.locator('footer')).not.toContainText(/ФОП|ІПН|РНОКПП/);
  });
});

test('над квизом — подзаголовок про месенджер', async ({ page }) => {
  await page.goto('/kukhni');
  await expect(page.locator('#kvyz .section-title__subtitle')).toHaveText(
    'Оберіть, що вам потрібно, — ми порахуємо і надішлемо ціну у зручний для вас месенджер',
  );
});

test.describe('блок «Нестандартне завдання» (#zapyt)', () => {
  test('на /kontakty (с главной перенесён 2026-10-21), подзаголовок без имени и минут, без фото владельца', async ({ page }) => {
    await page.goto('/kontakty');
    await expect(page.locator('#zapyt')).toHaveCount(1);
    const block = page.locator('#zapyt');
    await expect(block.locator('h2')).toHaveText('Нестандартне завдання');
    await expect(block.locator('.zapyt__lead')).toHaveText(
      'Опишіть, що потрібно зробити — ми зв’яжемося з вами особисто у робочий час і дамо детальну відповідь: терміни, орієнтовну вартість і наступні кроки.',
    );
    await expect(block.locator('.ph, .zapyt__photo, .fact-ph')).toHaveCount(0);
  });

  test('кнопка «Надіслати запит» графитовая, не жёлтая', async ({ page }) => {
    await page.goto('/kontakty#zapyt');
    const button = page.locator('#zapyt').getByRole('button', { name: 'Надіслати запит' });
    await button.scrollIntoViewIfNeeded();
    await expect(button).toHaveCSS('background-color', 'rgb(30, 33, 36)');
    expect(await yellowOnScreen(page)).not.toContain('Надіслати запит');
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  });

  test('пустая отправка — ошибки у описания, имени, телефона, согласия; короткое описание не проходит', async ({ page }) => {
    await page.goto('/kontakty#zapyt');
    const form = page.locator('#zapyt form');
    await form.getByRole('button', { name: 'Надіслати запит' }).click();
    await expect(page.locator('#zapyt-request')).toBeFocused();
    for (const id of ['request', 'name', 'phone', 'consent']) await expect(page.locator(`#zapyt-${id}-error`)).toBeVisible();
    await page.locator('#zapyt-request').fill('Коротко');
    await form.getByRole('button', { name: 'Надіслати запит' }).click();
    await expect(page.locator('#zapyt-request-error')).toContainText('10');
  });

  test('файлы: больше 3, не тот тип или больше 10 МБ — понятная ошибка', async ({ page }) => {
    await page.goto('/kontakty#zapyt');
    const input = page.locator('#zapyt-files');
    const file = (name: string, size = 10) => ({ name, mimeType: 'application/octet-stream', buffer: Buffer.alloc(size) });
    await input.setInputFiles([file('1.jpg'), file('2.png'), file('3.heic'), file('4.pdf')]);
    await expect(page.locator('#zapyt-files-error')).toContainText('Не більше 3 файлів');
    await input.setInputFiles([file('кухня.docx')]);
    await expect(page.locator('#zapyt-files-error')).toContainText('JPG, PNG, HEIC або PDF');
    await input.setInputFiles([file('план.pdf', 10 * 1024 * 1024 + 1)]);
    await expect(page.locator('#zapyt-files-error')).toContainText('10 МБ');
    await input.setInputFiles([file('план.pdf'), file('фото.HEIC')]);
    await expect(page.locator('#zapyt-files-error')).toBeHidden();
    await expect(page.locator('[data-files-chosen]')).toHaveText('план.pdf, фото.HEIC');
  });

  test('заполненный запрос → одна заявка с файлом в api/lead.php, /dyakuyemo «Надішлемо розрахунок у Viber»', async ({ page, leadApi }) => {
    await page.goto('/kontakty#zapyt');
    await page.locator('#zapyt-request').fill('Стелаж у нішу 2,4 м і стіл для салону краси');
    await page.locator('#zapyt-files').setInputFiles([{ name: 'ескіз.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(100) }]);
    await expect(page.locator('#zapyt').getByRole('radio', { name: 'Viber' })).toBeChecked();
    await page.locator('#zapyt-name').fill('Ігор');
    await page.locator('#zapyt-phone').click();
    await page.locator('#zapyt-phone').pressSequentially('0671234567');
    await page.locator('#zapyt-referrer').fill('Олена');
    await page.locator('#zapyt-consent').check();
    await page.locator('#zapyt form').getByRole('button', { name: 'Надіслати запит' }).click();
    await expect(page).toHaveURL(/\/dyakuyemo$/);
    await expect(page.locator('[data-thanks]')).toHaveText(/^Дякуємо, Ігор\. Надішлемо розрахунок у Viber у робочий час\.$/);
    expect(leadApi.leads).toHaveLength(1);
    expect(leadApi.leads[0]).toMatchObject({
      contactMethod: 'viber',
      form: 'zapyt',
      request: 'Стелаж у нішу 2,4 м і стіл для салону краси',
      name: 'Ігор',
      phone: '+380671234567',
      referrer: 'Олена',
      __files: ['ескіз.jpg'],
    });
  });
});

test.describe('реферальная программа', () => {
  test('поле «Хто вас порекомендував?» есть во всех формах и необязательное', async ({ page }) => {
    // формы ТЗ v2: квиз и «Нестандартне завдання»
    await page.goto('/kukhni');
    for (const id of ['quiz-referrer']) {
      const field = page.locator(`#${id}`);
      await expect(field).toHaveCount(1);
      await expect(field).not.toHaveAttribute('required', /.*/);
      await expect(page.locator(`label[for="${id}"]`)).toContainText('Хто вас порекомендував?');
    }
    await page.goto('/kontakty');
    await expect(page.locator('#zapyt-referrer')).toHaveCount(1);
  });

  test('блок «Рекомендуйте нас» скрыт, пока флаг referralEnabled выключен', async ({ page }) => {
    await page.goto('/kukhni');
    await expect(page.locator('#rekomenduyte')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Рекомендуйте нас');
  });
});
