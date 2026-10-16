import { expect, test } from '@playwright/test';

// Поля формы замера (блок 13)
test.describe('поля формы', () => {
  test('маска телефона: 0671234567 → +380 67 123 45 67', async ({ page }) => {
    await page.goto('/');
    const phone = page.locator('#zamir-phone');
    await phone.click();
    await expect(phone).toHaveValue('+380 ');
    await phone.pressSequentially('0671234567');
    await expect(phone).toHaveValue('+380 67 123 45 67');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
  });

  test('Backspace стирает номер вместе с +380, поле не застревает', async ({ page }) => {
    await page.goto('/');
    const phone = page.locator('#zamir-phone');
    await phone.click();
    await phone.pressSequentially('0671');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Backspace');
    await expect(phone).toHaveValue('');
  });

  test('скрытая ошибка не подключена к aria-describedby, показанная — подключена', async ({ page }) => {
    await page.goto('/');
    const name = page.locator('#zamir-name');
    expect(await name.getAttribute('aria-describedby') ?? '').not.toContain('zamir-name-error');
    await page.locator('#zamir form button[type=submit]').click();
    await expect(name).toHaveAttribute('aria-describedby', /zamir-name-error/);
    await name.fill('Тест');
    expect(await name.getAttribute('aria-describedby') ?? '').not.toContain('zamir-name-error');
  });

  test('поля 48 px и шрифт 16 px (iOS не зумит), согласие не отмечено', async ({ page }) => {
    await page.goto('/');
    for (const sel of ['#zamir-name', '#zamir-phone', '#zamir-time']) {
      const f = page.locator(sel);
      await expect(f).toHaveCSS('font-size', '16px');
      expect((await f.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
    await expect(page.locator('#zamir-consent')).not.toBeChecked();
  });

  test('поле-ловушка не попадает в порядок Tab и скрыто от скринридера', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#zamir-website')).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('.hp').first()).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('блок 13: форма замера', () => {
  test('пустая отправка: ошибки текстом, фокус на первом поле, запросов в сеть нет', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET') posts.push(r.url());
    });
    await page.goto('/');
    const form = page.locator('#zamir form');
    await form.getByRole('button', { name: 'Надіслати заявку' }).click();
    await expect(page.locator('#zamir-name')).toBeFocused();
    await expect(page.locator('#zamir-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#zamir-name-error')).toBeVisible();
    await expect(page.locator('#zamir-phone-error')).toBeVisible();
    await expect(page.locator('#zamir-consent-error')).toBeVisible();
    await expect(page).toHaveURL(/\/(#.*)?$/);
    expect(posts).toEqual([]);
  });

  test('заполненная форма проходит проверку, номер приведён к +380XXXXXXXXX, в сеть не уходит', async ({ page }) => {
    const posts: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET') posts.push(r.url());
    });
    await page.goto('/');
    await page.locator('#zamir-name').fill('Тест');
    await page.locator('#zamir-phone').click();
    await page.locator('#zamir-phone').pressSequentially('0671234567');
    await page.locator('#zamir-consent').check();
    await page.locator('#zamir form').getByRole('button', { name: 'Надіслати заявку' }).click();
    await expect(page.locator('#zamir [data-form-status]')).toContainText('Перевірку пройдено');
    await expect(page.locator('#zamir-phone')).toHaveAttribute('data-normalized', '+380671234567');
    expect(posts).toEqual([]);
  });

  test('телефон: при фокусе в поле нижняя панель скрыта, кнопка отправки видна', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/');
    await page.locator('#zamir-phone').focus();
    await expect(page.locator('[data-bottom-bar]')).toHaveAttribute('data-hidden', '');
    const submit = page.locator('#zamir form').getByRole('button', { name: 'Надіслати заявку' });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
  });
});
