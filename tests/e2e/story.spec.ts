import { expect, test } from '@playwright/test';

// «Як ми створюємо»: сюжет кухни, 7 этапов на сцене 4:3 (решение владельца, 2026-10-21)
const PATH = '/yak-my-stvoriuiemo';
const TITLES = ['Почнемо з вашого розміру', 'Дизайн-проєкт', 'Корпуси', 'Фасади', 'Стільниця', 'Світло і техніка', 'Готово'];
const FILES = ['01-empty', '02-design', '03-carcass', '04-fronts', '05-countertop', '06-light', '07-ready'];

const story = (page: import('@playwright/test').Page) => page.locator('[data-story="kitchen"]');
const visibleFrames = (page: import('@playwright/test').Page) =>
  story(page)
    .locator('.story__frame')
    .evaluateAll((els) => els.filter((e) => getComputedStyle(e).visibility === 'visible').map((e) => Number((e as HTMLElement).dataset.frame)));

test.describe('сюжет кухни', () => {
  test('7 этапов по порядку, кадры kitchen-01 … kitchen-07 в том же порядке', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('h1')).toHaveText('Як ми створюємо');
    await expect(story(page).locator('.story__title')).toHaveText(TITLES);
    const srcs = await story(page).locator('.story__frame img').evaluateAll((els) => els.map((e) => (e as HTMLImageElement).currentSrc || (e as HTMLImageElement).src));
    expect(srcs).toHaveLength(7);
    srcs.forEach((src, i) => expect(src).toContain(`kitchen-${FILES[i]}`));
  });

  test('сцена 4:3, кадр вписан целиком без обрезки', async ({ page }) => {
    await page.goto(PATH);
    const scene = (await story(page).locator('.story__scene').boundingBox())!;
    expect(Math.abs(scene.width / scene.height - 4 / 3)).toBeLessThan(0.01);
    const img = story(page).locator('[data-frame="1"] img');
    await expect(img).toHaveCSS('object-fit', 'contain');
    const ratio = await img.evaluate((e: HTMLImageElement) => e.naturalWidth / e.naturalHeight);
    expect(Math.abs(ratio - 4 / 3)).toBeLessThan(0.01); // кадр сам 4:3 — в сцене 4:3 полей и обрезки нет
  });

  test('под сценой серая подпись «Візуалізація етапів»', async ({ page }) => {
    await page.goto(PATH);
    const note = story(page).locator('.story__note');
    await expect(note).toHaveText('Візуалізація етапів');
    await expect(note).toHaveCSS('color', 'rgb(92, 97, 102)');
    const sceneBottom = (await story(page).locator('.story__scene').boundingBox())!;
    const noteBox = (await note.boundingBox())!;
    expect(noteBox.y).toBeGreaterThanOrEqual(sceneBottom.y + sceneBottom.height);
  });

  test('виден один кадр; выбор этапа мышью и стрелками клавиатуры', async ({ page }) => {
    await page.goto(PATH);
    expect(await visibleFrames(page)).toEqual([1]);
    await story(page).getByRole('radio', { name: 'Фасади' }).click();
    await expect.poll(() => visibleFrames(page)).toEqual([4]);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => visibleFrames(page)).toEqual([5]);
    await story(page).getByRole('radio', { name: 'Готово' }).click();
    await expect.poll(() => visibleFrames(page)).toEqual([7]);
    const box = (await story(page).locator('.story__stage').first().boundingBox())!;
    expect(box.height).toBeGreaterThanOrEqual(48);
  });

  test('без JS этапы тоже переключаются', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(PATH);
    await story(page).getByRole('radio', { name: 'Корпуси' }).click();
    await expect.poll(() => visibleFrames(page)).toEqual([3]);
    await ctx.close();
  });

  test('размерные линии только на этапе 1 и внутри сцены', async ({ page }) => {
    await page.goto(PATH);
    const dims = story(page).locator('[data-dims]');
    await expect(dims).toHaveCount(1);
    await expect(dims).toBeVisible();
    await expect(dims).toContainText('ширина стіни');
    await expect(dims).toContainText('висота');
    const scene = (await story(page).locator('.story__scene').boundingBox())!;
    for (const label of await dims.locator('.story__dim-label').all()) {
      const b = (await label.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(scene.x);
      expect(b.x + b.width).toBeLessThanOrEqual(scene.x + scene.width);
    }
    await story(page).getByRole('radio', { name: 'Дизайн-проєкт' }).click();
    await expect(dims).toBeHidden();
  });

  test('кадры — WebP, каждый размер до 200 КБ', async ({ page }) => {
    await page.goto(PATH);
    const urls = await story(page)
      .locator('.story__frame img')
      .evaluateAll((els) => els.flatMap((e) => (e.getAttribute('srcset') ?? '').split(',').map((p) => p.trim().split(' ')[0])).filter(Boolean));
    expect(urls.length).toBeGreaterThanOrEqual(7);
    for (const url of new Set(urls)) {
      expect(url).toMatch(/\.webp$/);
      const res = await page.request.get(url);
      expect(res.ok()).toBe(true);
      expect((await res.body()).length, url).toBeLessThanOrEqual(200 * 1024);
    }
  });
});
