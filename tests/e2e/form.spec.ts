import { expect, test } from '@playwright/test';

// Поля форм (маска телефона, ошибки, размеры) — на форме «Нестандартне завдання» (/kontakty#zapyt).
// С ТЗ v2 короткой формы замера в финале нет; отправку формы проверяет update-2026-10.spec, квиза — quiz.spec.
test.describe('поля формы', () => {
  test('маска телефона: 0671234567 → +380 67 123 45 67', async ({ page }) => {
    await page.goto('/kontakty');
    const phone = page.locator('#zapyt-phone');
    await phone.click();
    await expect(phone).toHaveValue('+380 ');
    await phone.pressSequentially('0671234567');
    await expect(phone).toHaveValue('+380 67 123 45 67');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
  });

  test('Backspace стирает номер вместе с +380, поле не застревает', async ({ page }) => {
    await page.goto('/kontakty');
    const phone = page.locator('#zapyt-phone');
    await phone.click();
    await phone.pressSequentially('0671');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await expect(phone).toHaveValue('');
  });

  test('скрытая ошибка не подключена к aria-describedby, показанная — подключена', async ({ page }) => {
    await page.goto('/kontakty');
    const name = page.locator('#zapyt-name');
    expect(await name.getAttribute('aria-describedby') ?? '').not.toContain('zapyt-name-error');
    await page.locator('#zapyt form button[type=submit]').click();
    await expect(name).toHaveAttribute('aria-describedby', /zapyt-name-error/);
    await name.fill('Тест');
    expect(await name.getAttribute('aria-describedby') ?? '').not.toContain('zapyt-name-error');
  });

  for (const pasted of ['0671234567', '+380671234567', '+38 (067) 123-45-67']) {
    test(`вставка из буфера «${pasted}» → +380 67 123 45 67`, async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'права на буфер обмена — только Chromium');
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.goto('/kontakty');
      const phone = page.locator('#zapyt-phone');
      await phone.click(); // в поле уже «+380 »
      await page.evaluate((t) => navigator.clipboard.writeText(t), pasted);
      await page.keyboard.press('ControlOrMeta+V');
      await expect(phone).toHaveValue('+380 67 123 45 67');
    });
  }

  test('маска привязана к своему полю: у каждого поля телефона своя', async ({ page }) => {
    await page.goto('/kontakty');
    await expect(page.locator('phone-field input[data-masked]')).toHaveCount(await page.locator('phone-field').count());
  });

  test('поля 48 px и шрифт 16 px (iOS не зумит), согласие не отмечено', async ({ page }) => {
    await page.goto('/kontakty');
    for (const sel of ['#zapyt-name', '#zapyt-phone']) {
      const f = page.locator(sel);
      await expect(f).toHaveCSS('font-size', '16px');
      expect((await f.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator('#zapyt-consent')).not.toBeChecked();
  });

  test('поле-ловушка не попадает в порядок Tab и скрыто от скринридера', async ({ page }) => {
    await page.goto('/kontakty');
    await expect(page.locator('#zapyt-website')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('.hp').first()).toHaveAttribute('aria-hidden', 'true');
  });
});
