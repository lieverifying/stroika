import { expect, test } from '@playwright/test';

// Попап замера из шапки (<dialog>)
test.describe('попап замера', () => {
  test('десктоп: кнопка шапки открывает попап; закрытие крестиком, Esc и кликом по фону; фокус возвращается', async ({ page, isMobile }) => {
    test.skip(isMobile, 'кнопка в шапке — только десктоп');
    await page.goto('/');
    const open = page.locator('[data-header] [data-zamir-open]').first();
    const dialog = page.locator('[data-zamir-modal]');

    await open.click();
    await expect(dialog).toBeVisible();
    await expect(page.locator('#modal-name')).toBeFocused();
    await expect(page).toHaveURL(/\/$/); // ссылка не сработала — открылся попап
    await dialog.getByRole('button', { name: 'Закрити' }).click();
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await open.click();
    await page.mouse.click(5, 400); // фон за окном
    await expect(dialog).toBeHidden();
  });

  test('в попапе жёлтая кнопка — «Надіслати заявку» в окне, ошибки показываются', async ({ page, isMobile }) => {
    test.skip(isMobile, 'кнопка в шапке — только десктоп');
    await page.goto('/');
    await page.locator('[data-header] [data-zamir-open]').first().click();
    const submit = page.locator('[data-zamir-modal] button[type=submit]');
    await expect(submit).toHaveAttribute('data-cta-on', '');
    await submit.click();
    await expect(page.locator('#modal-name-error')).toBeVisible();
  });

  test('телефон: попап из мобильного меню — меню закрыто, панель скрыта, форма прокручивается внутри окна', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.setViewportSize({ width: 375, height: 600 });
    await page.goto('/');
    await page.locator('[data-menu-toggle]').click();
    await page.locator('#mobile-menu [data-zamir-open]').click();
    await expect(page.locator('[data-zamir-modal]')).toBeVisible();
    await expect(page.locator('#mobile-menu')).toBeHidden();
    await expect(page.locator('[data-bottom-bar]')).toHaveAttribute('data-hidden', '');
    const { sh, ch } = await page.locator('[data-zamir-modal]').evaluate((el) => ({ sh: el.scrollHeight, ch: el.clientHeight }));
    expect(ch).toBeLessThanOrEqual(600);
    expect(sh).toBeGreaterThan(ch);
    const submit = page.locator('[data-zamir-modal] button[type=submit]');
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
  });
});
