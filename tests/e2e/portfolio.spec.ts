import { expect, test, type Page } from './fixtures';
import { readFileSync } from 'node:fs';

// «Роботи нашої команди» (ТЗ v2, 2026-10-21): галерея из src/content/portfolio.json — фото архива vymir-foto, блоки на главной и посадочных
interface Item { id: string; type: 'photo' | 'video'; category: string; src: string; poster?: string; width: number; height: number; focus?: string; alt: string }
const data = JSON.parse(readFileSync(new URL('../../src/content/portfolio.json', import.meta.url), 'utf8')) as {
  categories: { id: string; title: string }[];
  featured: { home: string[]; kukhni: string[]; mebli: string[] };
  items: Item[];
};
const photos = (cat?: string) => data.items.filter((i) => i.type === 'photo' && (!cat || i.category === cat));
const lb = (page: Page) => page.locator('[data-lightbox]');
const count = (page: Page) => lb(page).locator('[data-lb-count]');

test.describe('/roboty', () => {
  test('сетка строится из portfolio.json: все работы, подписи, размеры, первые 4 без lazy', async ({ page }) => {
    await page.goto('/roboty');
    await expect(page.locator('h1')).toHaveText('Роботи нашої команди');
    const items = page.locator('.pf__item');
    await expect(items).toHaveCount(data.items.length);
    expect(await items.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id))).toEqual(data.items.map((i) => i.id));
    const imgs = page.locator('.pf__open img');
    await expect(imgs).toHaveCount(photos().length);
    for (const [n, item] of photos().entries()) {
      const img = imgs.nth(n);
      await expect(img).toHaveAttribute('src', `/portfolio/${item.src.replace('.webp', '-960.webp')}`);
      await expect(img).toHaveAttribute('srcset', new RegExp(`-480\\.webp 480w, .+-960\\.webp ${Math.min(960, item.width)}w`));
      await expect(img).toHaveAttribute('alt', item.alt);
      await expect(img).toHaveAttribute('width', String(item.width));
      if (n < 4) await expect(img).not.toHaveAttribute('loading', 'lazy');
      else await expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  test('карточки: 4:5 на телефоне, 1:1 с 768 px; горизонтальные фото — на две колонки; обрезка по focus', async ({ page, isMobile }) => {
    await page.goto('/roboty');
    const boxes = await page.locator('.pf__item').evaluateAll((els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect();
        const img = e.querySelector('img') as HTMLImageElement;
        return { id: (e as HTMLElement).dataset.id!, ratio: r.width / r.height, wide: e.classList.contains('pf__item--wide'), pos: getComputedStyle(img).objectPosition };
      }),
    );
    for (const b of boxes) {
      const item = data.items.find((i) => i.id === b.id)!;
      expect(b.wide, b.id).toBe(item.width / item.height > 1.2);
      if (!b.wide) expect(b.ratio, b.id).toBeCloseTo(isMobile ? 0.8 : 1, 1);
      expect(b.pos, b.id).toBe(item.focus ?? '50% 50%');
    }
    const cols = await page.locator('.pf').evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(cols).toBe(isMobile ? 2 : 3);
  });

  test('вкладки «Усі · Кухні · Шафи · Гардеробні · Інші меблі»; фильтр и адрес #категорія; на телефоне вкладки листаются вбок', async ({ page, isMobile }) => {
    await page.goto('/roboty');
    const tabs = page.locator('[data-filter]');
    await expect(tabs).toHaveText(['Усі', 'Кухні', 'Шафи', 'Гардеробні', 'Інші меблі']);
    for (const t of await tabs.all()) expect((await t.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    if (isMobile) {
      const strip = page.locator('.roboty__tabs');
      expect(await strip.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
      await expect(strip).toHaveCSS('overflow-x', 'auto');
    }
    await page.getByRole('button', { name: 'Кухні', exact: true }).click();
    await expect(page.locator('.pf__item:visible')).toHaveCount(data.items.filter((i) => i.category === 'kukhni').length);
    await expect(page).toHaveURL(/#kukhni$/);
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

  test('только архив vymir-foto: 21 фото, стеновых панелей нет, видео нет; kukhni-klasyka-01 — только в галерее', async () => {
    const ids = data.items.map((i) => i.id);
    expect(ids).toHaveLength(21);
    expect(ids.some((id) => id.startsWith('vyklucheno'))).toBe(false);
    expect(data.items.every((i) => i.type === 'photo')).toBe(true);
    for (const list of Object.values(data.featured)) expect(list).not.toContain('kukhni-klasyka-01');
  });
});

test.describe('посадочные: блок работ', () => {
  test('/kukhni: 6 кухонь из featured.kukhni по порядку, «Усі роботи» → галерея, фото открывается на весь экран', async ({ page }) => {
    await page.goto('/kukhni');
    const block = page.locator('[data-block="3"]');
    await expect(block.locator('h2')).toHaveText('Роботи нашої команди');
    expect(await block.locator('.pf__item').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id))).toEqual(data.featured.kukhni);
    await expect(block.getByRole('link', { name: 'Усі роботи' })).toHaveAttribute('href', '/roboty#kukhni');
    await block.locator('.pf__open').first().click();
    await expect(lb(page)).toHaveAttribute('open', '');
    await expect(count(page)).toHaveText('1 / 6');
  });

  test('/mebli: работы из featured.mebli, «Усі роботи» → галерея', async ({ page }) => {
    await page.goto('/mebli');
    const block = page.locator('[data-block="3"]');
    expect(await block.locator('.pf__item').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id))).toEqual(data.featured.mebli);
    await expect(block.getByRole('link', { name: 'Усі роботи' })).toHaveAttribute('href', '/roboty#shafy');
  });

  test('ряды заполнены целиком: 2 в ряд на телефоне, 3 с 768 px, высота в ряду одинаковая', async ({ page, isMobile }) => {
    await page.goto('/kukhni');
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
