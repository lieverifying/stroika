import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const readStory = (id: string) =>
  JSON.parse(readFileSync(new URL(`../../src/content/stories/${id}.json`, import.meta.url), 'utf8')) as { stages: { title: string; text: string }[] };
const kitchen = readStory('kitchen');
const wardrobe = readStory('wardrobe');

// «Як ми створюємо»: этапы меняются прокруткой (sticky-сцена), клик и стрелки — дополнительно;
// при prefers-reduced-motion и без JS — статичный список (решение владельца, 2026-10-21)
const PATH = '/yak-my-stvoriuiemo';
const K = '[data-story="kitchen"]';
const W = '[data-story="wardrobe"]';

/** Прокрутить к середине участка этапа k (участок — 70 % высоты окна) */
async function scrollToStage(page: Page, sel: string, k: number) {
  await page.evaluate(
    ({ sel, k }) => {
      const root = document.querySelector(sel)!;
      const track = root.querySelector('.story__track')!;
      const top = parseFloat(getComputedStyle(root.querySelector('.story__sticky')!).top) || 0;
      window.scrollTo(0, track.getBoundingClientRect().top + scrollY - top + (k + 0.5) * innerHeight * 0.7);
    },
    { sel, k },
  );
}
const active = (page: Page, sel: string) => page.locator(sel).getAttribute('data-active');
const loadedFrames = (page: Page) =>
  page.locator(`${K} .story__step img.story__img`).evaluateAll((els) => els.map((e) => Boolean((e as HTMLImageElement).getAttribute('src'))));

test.describe('сюжет кухни: прокрутка', () => {
  test('этап меняется при прокрутке, подпись (номер, заголовок, текст) — вместе с кадром', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator(K)).toHaveClass(/story--scroll/);
    for (const k of [0, 3, 6]) {
      await scrollToStage(page, K, k);
      await expect.poll(() => active(page, K)).toBe(String(k));
      const step = page.locator(`${K} .story__step[data-active]`);
      await expect(step).toHaveCount(1);
      await expect(step.locator('.story__num')).toHaveText(`0${k + 1} / 07`);
      await expect(step.locator('.story__title')).toHaveText(kitchen.stages[k].title);
      await expect(step.locator('.story__text')).toHaveText(kitchen.stages[k].text);
      await expect(step).toHaveCSS('opacity', '1');
      await expect(step.locator('.story__frame')).toBeInViewport();
    }
  });

  test('сцена закреплена: при прокрутке внутри сюжета её верх не двигается', async ({ page }) => {
    await page.goto(PATH);
    await scrollToStage(page, K, 1);
    const y1 = await page.locator(`${K} .story__sticky`).evaluate((e) => e.getBoundingClientRect().top);
    await scrollToStage(page, K, 4);
    const y2 = await page.locator(`${K} .story__sticky`).evaluate((e) => e.getBoundingClientRect().top);
    expect(Math.abs(y1 - y2)).toBeLessThan(2);
  });

  test('индикатор сбоку; клик по нему и стрелки — переход к этапу', async ({ page }) => {
    await page.goto(PATH);
    const dots = page.locator(`${K} [data-go]`);
    await expect(dots).toHaveCount(7);
    await scrollToStage(page, K, 0);
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'step');
    expect((await dots.nth(0).boundingBox())!.height).toBeGreaterThanOrEqual(48);
    await dots.nth(4).click();
    await expect.poll(() => active(page, K)).toBe('4');
    await expect(dots.nth(4)).toHaveAttribute('aria-current', 'step');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => active(page, K)).toBe('5');
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => active(page, K)).toBe('4');
  });

  test('грузятся только текущий и следующий кадр', async ({ page }) => {
    await page.goto(PATH);
    await expect.poll(() => loadedFrames(page)).toEqual([true, true, false, false, false, false, false]);
    await scrollToStage(page, K, 3);
    await expect.poll(() => active(page, K)).toBe('3');
    const loaded = await loadedFrames(page);
    expect(loaded[3]).toBe(true);
    expect(loaded[4]).toBe(true);
    expect(loaded[6]).toBe(false);
  });

  test('story_complete — один раз, при последнем этапе кухни', async ({ page }) => {
    await page.goto(PATH);
    const events = () => page.evaluate(() => ((window as unknown as { dataLayer?: { event: string; story?: string }[] }).dataLayer ?? []).filter((e) => e.event === 'story_complete'));
    await scrollToStage(page, K, 5);
    await expect.poll(() => active(page, K)).toBe('5');
    expect(await events()).toEqual([]);
    await scrollToStage(page, K, 6);
    await expect.poll(() => active(page, K)).toBe('6');
    await scrollToStage(page, K, 5);
    await scrollToStage(page, K, 6);
    await expect.poll(() => events()).toEqual([{ event: 'story_complete', story: 'kitchen' }]);
    // сюжет шафы событие не шлёт
    await scrollToStage(page, W, 4);
    await expect.poll(() => active(page, W)).toBe('4');
    expect(await events()).toHaveLength(1);
  });
});

test.describe('статичный режим', () => {
  for (const mode of ['prefers-reduced-motion', 'без JavaScript'] as const) {
    test(`${mode}: этапы друг под другом, без закрепления и индикатора`, async ({ browser, isMobile }) => {
      const ctx = await browser.newContext({
        viewport: isMobile ? { width: 375, height: 812 } : { width: 1280, height: 800 },
        ...(mode === 'prefers-reduced-motion' ? { reducedMotion: 'reduce' as const } : { javaScriptEnabled: false }),
      });
      const page = await ctx.newPage();
      await page.goto(PATH);
      const root = page.locator(K);
      await expect(root).not.toHaveClass(/story--scroll/);
      await expect(root.locator('.story__progress')).toBeHidden();
      const tops = await root.locator('.story__step').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
      expect(tops).toHaveLength(7);
      for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
      for (const step of await root.locator('.story__step').all()) await expect(step).toHaveCSS('opacity', '1');
      await expect(root.locator('.story__sticky')).toHaveCSS('position', 'static');
      await ctx.close();
    });
  }
});

test.describe('содержимое', () => {
  test('кухня: 7 этапов по порядку, кадры kitchen-01 … 07, сцена 4:3 без обрезки, подпись «Візуалізація етапів»', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator(`${K} .story__title`)).toHaveText(kitchen.stages.map((s) => s.title));
    const files = await page.locator(`${K} .story__step img.story__img`).evaluateAll((els) => els.map((e) => e.getAttribute('data-src') ?? e.getAttribute('src')));
    files.forEach((f, i) => expect(f).toContain(`kitchen-0${i + 1}-`));
    const frame = (await page.locator(`${K} [data-step="0"] .story__frame`).boundingBox())!;
    expect(Math.abs(frame.width / frame.height - 4 / 3)).toBeLessThan(0.01);
    await expect(page.locator(`${K} [data-step="0"] img`)).toHaveCSS('object-fit', 'contain');
    await expect(page.locator(`${K} [data-step="0"] .story__note`)).toHaveText('Візуалізація етапів');
    await expect(page.locator(`${K} [data-step="0"] .story__note`)).toHaveCSS('color', 'rgb(92, 97, 102)');
  });

  test('шафа-купе (flags.storyWardrobe): 5 этапов, кадры wardrobe-01 … 05, сцена 4:3, подпись «Візуалізація етапів»', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator(`${W} h2`)).toHaveText('Шафа-купе');
    await expect(page.locator(`${W} .story__title`)).toHaveText(['Порожня ніша', 'Дизайн-проєкт', 'Корпус', 'Двері', 'Готово']);
    expect(wardrobe.stages.map((s) => s.title)).toEqual(['Порожня ніша', 'Дизайн-проєкт', 'Корпус', 'Двері', 'Готово']);
    const files = await page.locator(`${W} .story__step img.story__img`).evaluateAll((els) => els.map((e) => e.getAttribute('data-src') ?? e.getAttribute('src')));
    expect(files).toHaveLength(5);
    ['01-empty', '02-design', '03-carcass', '04-doors', '05-ready'].forEach((f, i) => expect(files[i]).toContain(`wardrobe-${f}`));
    await expect(page.locator(`${W} .ph`)).toHaveCount(0); // плейсхолдеров больше нет
    await expect(page.locator(`${W} .story__note`)).toHaveCount(5);
    await expect(page.locator(`${W} .story__note`).first()).toHaveText('Візуалізація етапів');
    await scrollToStage(page, W, 2);
    await expect.poll(() => active(page, W)).toBe('2');
    const frame = (await page.locator(`${W} [data-step="2"] .story__frame`).boundingBox())!;
    expect(Math.abs(frame.width / frame.height - 4 / 3)).toBeLessThan(0.01);
    await expect(page.locator(`${W} [data-step="2"] img`)).toHaveCSS('object-fit', 'contain');
    await expect(page.locator(`${W} [data-step="2"] .story__note`)).toBeVisible();
  });

  test('размерные линии — только на этапе 1; на 375 px «ширина стіни» не касается розетки', async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator(`${K} [data-dims]`)).toHaveCount(1);
    await expect(page.locator(`${K} [data-step="0"] [data-dims]`)).toBeVisible();
    const frame = (await page.locator(`${K} [data-step="0"] .story__frame`).boundingBox())!;
    const s = frame.width / 1448;
    // розетки у пола на кадре kitchen-01-empty (px кадра): левая x 298–352, y 732–762; правая x 993–1025, y 662–690
    const sockets = [
      [298, 732, 352, 762],
      [993, 662, 1025, 690],
    ].map(([x1, y1, x2, y2]) => ({ x1: frame.x + x1 * s, y1: frame.y + y1 * s, x2: frame.x + x2 * s, y2: frame.y + y2 * s }));
    const l = (await page.locator(`${K} .dims__label--w`).boundingBox())!;
    for (const r of sockets) {
      const overlap = l.x < r.x2 && l.x + l.width > r.x1 && l.y < r.y2 && l.y + l.height > r.y1;
      expect(overlap).toBe(false);
    }
  });

  test('кадры обоих сюжетов — WebP, каждый размер до 200 КБ', async ({ page }) => {
    await page.goto(PATH);
    const urls = await page
      .locator('[data-story] .story__step img.story__img')
      .evaluateAll((els) => els.flatMap((e) => (e.getAttribute('srcset') ?? e.getAttribute('data-srcset') ?? '').split(',').map((p) => p.trim().split(' ')[0])).filter(Boolean));
    expect(urls.length).toBe((7 + 5) * 4);
    for (const url of new Set(urls)) {
      expect(url).toMatch(/\.webp$/);
      const res = await page.request.get(url);
      expect((await res.body()).length, url).toBeLessThanOrEqual(200 * 1024);
    }
  });

  test('JS страницы — до 10 КБ', async ({ page }) => {
    const sizes: number[] = [];
    page.on('response', async (r) => {
      if (r.request().resourceType() === 'script') sizes.push((await r.body()).length);
    });
    await page.goto(PATH);
    await page.waitForLoadState('networkidle');
    const total = sizes.reduce((a, b) => a + b, 0);
    console.log(`JS на странице: ${(total / 1024).toFixed(1)} КБ`);
    expect(total).toBeLessThanOrEqual(10 * 1024);
  });
});

test.describe('ссылки на страницу', () => {
  test('меню шапки: после «Роботи»; футер; на главной — сюжет кухни со ссылкой «Детальніше»', async ({ page, isMobile }) => {
    await page.goto('/kukhni');
    if (!isMobile) {
      const items = page.getByRole('navigation', { name: 'Головне меню' }).getByRole('link');
      await expect(items).toHaveText(['Кухні', 'Меблі', 'Роботи', 'Як ми створюємо', 'Контакти']);
    }
    await expect(page.locator('footer a[href="/yak-my-stvoriuiemo"]')).toHaveText('Як ми створюємо');
    // на главной — сам сюжет кухни с подписью «Візуалізація етапів» и ссылкой «Детальніше»
    const home = page.locator('main [data-story="kitchen"]');
    await expect(home.locator('h2')).toHaveText('Як ми створюємо кухню');
    await expect(home.locator('.story__note').first()).toHaveText('Візуалізація етапів');
    const more = home.getByRole('link', { name: 'Детальніше' });
    await expect(more).toHaveAttribute('href', '/yak-my-stvoriuiemo');
    await more.click();
    await expect(page).toHaveURL(/\/yak-my-stvoriuiemo$/);
  });
});
