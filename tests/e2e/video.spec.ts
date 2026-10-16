import { expect, test } from '@playwright/test';

// Блок 6 — видео бригады загружается только по клику
test.describe('видео бригады', () => {
  test('до клика нет ни <video>, ни запросов к видео; по клику появляется <video preload="none">', async ({ page }) => {
    const videoRequests: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'media' || /\.(mp4|webm)(\?|$)/.test(r.url())) videoRequests.push(r.url());
    });
    await page.goto('/');
    const facade = page.locator('[data-video-facade]');
    await facade.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await expect(facade.locator('video')).toHaveCount(0);
    expect(videoRequests).toEqual([]);

    await facade.getByRole('button', { name: /Дивитися відео/ }).click();
    await expect(facade.locator('video')).toHaveAttribute('preload', 'none');
  });

  test('кнопка доступна с клавиатуры и не меньше 48 px', async ({ page }) => {
    await page.goto('/');
    const button = page.locator('[data-video-facade] button');
    const box = (await button.boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-video-facade] video')).toHaveCount(1);
  });
});
