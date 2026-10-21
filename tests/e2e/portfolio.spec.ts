import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

// «Наші роботи» (решение владельца, 2026-10-21): галерея из src/content/portfolio.json, блок на главной
interface Item { id: string; type: 'photo' | 'video'; category: string; src: string; thumb?: string; poster?: string; width: number; height: number; alt: string }
const data = JSON.parse(readFileSync(new URL('../../src/content/portfolio.json', import.meta.url), 'utf8')) as {
  categories: { id: string; title: string }[];
  featured: string[];
  items: Item[];
};
const photos = (cat?: string) => data.items.filter((i) => i.type === 'photo' && (!cat || i.category === cat));
const lb = (page: Page) => page.locator('[data-lightbox]');
const count = (page: Page) => lb(page).locator('[data-lb-count]');

test.describe('/roboty', () => {
  test('сетка строится из portfolio.json: все работы, подписи, размеры, первые 4 без lazy', async ({ page }) => {
    await page.goto('/roboty');
    await expect(page.locator('h1')).toHaveText('Наші роботи');
    const items = page.locator('.pf__item');
    await expect(items).toHaveCount(data.items.length);
    expect(await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id))).toEqual(data.items.map((i) => i.id));
    const imgs = page.locator('.pf__open img');
    await expect(imgs).toHaveCount(photos().length);
    for (const [n, item] of photos().entries()) {
      const img = imgs.nth(n);
      await expect(img).toHaveAttribute('src', `/portfolio/${item.thumb}`);
      await expect(img).toHaveAttribute('alt', item.alt);
      await expect(img).toHaveAttribute('width', String(item.width));
      if (n < 4) await expect(img).not.toHaveAttribute('loading', 'lazy');
      else await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('превью без обрезки: пропорции плитки — как у фото', async ({ page }) => {
    await page.goto('/roboty');
    const ratios = await page.locator('.pf__item').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const m = e.querySelector('img, video') as HTMLImageElement;
        return { box: r.width / r.height, own: Number(m.getAttribute('width')) / Number(m.getAttribute('height')) };
      }),
    );
    for (const { box, own } of ratios) expect(Math.abs(box / own - 1)).toBeLessThan(0.03);
  });

  test('вкладки «Усі» + 4 категории; фильтр и адрес #категорія; на телефоне вкладки листаются вбок', async ({ page, isMobile }) => {
    await page.goto('/roboty');
    const tabs = page.locator('[data-filter]');
    await expect(tabs).toHaveText(['Усі', ...data.categories.map((c) => c.title)]);
    for (const t of await tabs.all()) expect((await t.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    if (isMobile) {
      const strip = page.locator('.roboty__tabs');
      expect(await strip.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
      await expect(strip).toHaveCSS('overflow-x', 'auto');
    }
    await page.getByRole('button', { name: 'Кухні', exact: true }).click();
    await expect(page.locator('.pf__item:visible')).toHaveCount(data.items.filter((i) => i.category === 'kuhni').length);
    await expect(page).toHaveURL(/#kuhni$/);
    await page.goto('/roboty#shafy');
    await expect(page.locator('[data-filter="shafy"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.pf__item:visible')).toHaveCount(data.items.filter((i) => i.category === 'shafy').length);
  });

  test('просмотр на весь экран: большой файл, стрелки, Esc, тап вне фото', async ({ page }) => {
    await page.goto('/roboty');
    await page.locator('.pf__open').first().click();
    await expect(lb(page)).toHaveAttribute('open', '');
    await expect(lb(page).locator('[data-lb-img]')).toHaveAttribute('src', `/portfolio/${photos()[0].src}`);
    await expect(count(page)).toHaveText(`1 / ${photos().length}`);
    await expect(lb(page).locator('[data-lb-caption]')).toHaveText(photos()[0].alt);
    await page.keyboard.press('ArrowRight');
    await expect(count(page)).toHaveText(`2 / ${photos().length}`);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(count(page)).toHaveText(`${photos().length} / ${photos().length}`);
    await page.keyboard.press('Escape');
    await expect(lb(page)).not.toHaveAttribute('open', '');
    // тап по полю вокруг фото
    await page.locator('.pf__open').nth(2).click();
    await expect(lb(page)).toHaveAttribute('open', '');
    await page.mouse.click(5, 70);
    await expect(lb(page)).not.toHaveAttribute('open', '');
  });

  test('листаются только фото текущей категории; свайп', async ({ page }) => {
    await page.goto('/roboty#shafy');
    await page.locator('.pf__item:visible .pf__open').first().click();
    await expect(count(page)).toHaveText(`1 / ${photos('shafy').length}`);
    const box = (await lb(page).locator('[data-lb-stage]').boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.2, y, { steps: 5 });
    await page.mouse.up();
    await expect(count(page)).toHaveText(`2 / ${photos('shafy').length}`);
    await expect(lb(page)).toHaveAttribute('open', ''); // свайп не закрывает
  });

  test('видео: muted, playsinline, loop, controls, preload="none", обложка; запуск только в видимой области', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { played: string[] };
      w.played = [];
      HTMLMediaElement.prototype.play = function () {
        w.played.push(this.getAttribute('src') ?? '');
        return Promise.resolve();
      };
    });
    await page.goto('/roboty');
    const videos = page.locator('video[data-pf-video]');
    await expect(videos).toHaveCount(2);
    for (const v of await videos.all()) {
      for (const a of ['muted', 'playsinline', 'loop', 'controls']) await expect(v).toHaveAttribute(a, '');
      await expect(v).toHaveAttribute('preload', 'none');
      await expect(v).toHaveAttribute('poster', /\/portfolio\/video\/.+-poster\.webp$/);
    }
    expect(await page.evaluate(() => (window as unknown as { played: string[] }).played)).toEqual([]);
    await videos.first().scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => (window as unknown as { played: string[] }).played.length)).toBeGreaterThan(0);
  });

  test('отбор: убранных фото нет; в подписях нет «кафе» и «бар»', async ({ page }) => {
    await page.goto('/roboty');
    const ids = data.items.map((i) => i.id);
    for (const gone of ['kuhni-06', 'kuhni-07', 'kuhni-16', 'kuhni-19', 'shafy-09', 'interier-08', 'komertsiia-06', 'komertsiia-07', 'komertsiia-09', 'komertsiia-10'])
      expect(ids).not.toContain(gone);
    const alts = await page.locator('.pf__item img, .pf__item video').evaluateAll((els) => els.map((e) => e.getAttribute('alt') ?? e.getAttribute('aria-label') ?? ''));
    for (const a of alts) expect(a).not.toMatch(/кафе|ресторан|\bбар\b|барі|бару|лаунж-бар/i);
  });
});

test.describe('главная: блок «Наші роботи»', () => {
  test('6 работ из featured по порядку, «Усі роботи» → /roboty, фото открывается на весь экран', async ({ page }) => {
    await page.goto('/');
    const block = page.locator('[data-block="3"]');
    await expect(block.locator('h2')).toHaveText('Наші роботи');
    expect(await block.locator('.pf__item').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id))).toEqual(data.featured);
    await expect(block.getByRole('link', { name: 'Усі роботи' })).toHaveAttribute('href', '/roboty');
    await block.locator('.pf__open').first().click();
    await expect(lb(page)).toHaveAttribute('open', '');
    await expect(count(page)).toHaveText('1 / 6');
  });

  test('ряды заполнены целиком: по 2 фото на телефоне, по 3 на десктопе, высота в ряду одинаковая', async ({ page, isMobile }) => {
    await page.goto('/');
    const rows = await page.locator('[data-block="3"] .pf__item').evaluateAll((els) => {
      const map = new Map<number, { h: number; right: number }[]>();
      for (const e of els) {
        const r = e.getBoundingClientRect();
        const key = Math.round(r.top);
        map.set(key, [...(map.get(key) ?? []), { h: r.height, right: r.right }]);
      }
      const gridRight = els[0].parentElement!.getBoundingClientRect().right;
      return [...map.values()].map((row) => ({ n: row.length, dh: Math.max(...row.map((x) => x.h)) - Math.min(...row.map((x) => x.h)), gap: gridRight - Math.max(...row.map((x) => x.right)) }));
    });
    expect(rows.map((r) => r.n)).toEqual(isMobile ? [2, 2, 2] : [3, 3]);
    for (const r of rows) {
      expect(r.dh).toBeLessThan(2);
      expect(r.gap).toBeLessThan(3);
    }
  });
});
