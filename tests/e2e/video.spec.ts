import { expect, test } from './fixtures';

// Видео-фасад. На главной видео скрыто, пока его нет (режим запуска) — компонент проверяем на /styleguide.
test.describe('видео бригады', () => {
  test('до клика нет ни <video>, ни запросов к видео; по клику появляется <video preload="none">', async ({ page }) => {
    const videoRequests: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'media' || /\.(mp4|webm)(\?|$)/.test(r.url())) videoRequests.push(r.url());
    });
    await page.goto('/styleguide');
    const facade = page.locator('[data-video-facade]');
    await facade.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle'); // все запросы после прокрутки завершены
    await expect(facade.locator('video')).toHaveCount(0);
    expect(videoRequests).toEqual([]);

    // Пока видео — заглушка, по клику ничего не грузится
    await facade.getByRole('button', { name: /Дивитися відео/ }).click();
    await page.waitForLoadState('networkidle');
    await expect(facade.locator('video')).toHaveCount(0);
    expect(videoRequests).toEqual([]);

    // С настоящим адресом по клику появляется <video preload="none">
    await facade.evaluate((el) => (el.dataset.src = '/photos/video/test.mp4'));
    await facade.getByRole('button', { name: /Дивитися відео/ }).click();
    await expect(facade.locator('video')).toHaveAttribute('preload', 'none');
  });

  test('кнопка доступна с клавиатуры и не меньше 48 px', async ({ page }) => {
    await page.goto('/styleguide');
    const button = page.locator('[data-video-facade] button');
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    await page.locator('[data-video-facade]').evaluate((el) => (el.dataset.src = '/photos/video/test.mp4'));
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-video-facade] video')).toHaveCount(1);
  });
});
