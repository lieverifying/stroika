import { expect, test } from './fixtures';
import { nextFrames, noTransitions, yellowOnScreen } from './helpers';

// Правило «один жёлтый элемент на экран» (ARCHITECTURE.md 6.9).
// Считаем видимые элементы с жёлтым фоном. Логотип (жёлтый угольник в <img>) не считается — решение владельца.
test.describe('один жёлтый на экран', () => {
  test('в разных точках прокрутки жёлтых элементов не больше одного', async ({ page }) => {
    await page.goto('/kukhni');
    await noTransitions(page);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await nextFrames(page); // IntersectionObserver пересчитал правило
      const yellow = await yellowOnScreen(page);
      expect(yellow.length, `y=${y}: ${yellow.join(' | ')}`).toBeLessThanOrEqual(1);
    }
  });

  test('десктоп, первый экран: жёлтая — кнопка hero', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/kukhni');
    await noTransitions(page);
    await expect.poll(() => yellowOnScreen(page)).toEqual(['Порахувати вартість']);
  });

  test('телефон: когда кнопка hero видна, жёлтая она, а не панель', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    await noTransitions(page);
    await page.locator('.hero__actions [data-cta]').scrollIntoViewIfNeeded();
    await expect.poll(() => yellowOnScreen(page)).toEqual(['Порахувати вартість']);
  });

  test('телефон: ниже hero жёлтой становится «Порахувати» в панели', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('[data-bottom-bar] [data-cta]')).toHaveAttribute('data-cta-on', '');
  });

  test('десктоп: ниже hero жёлтой становится кнопка шапки', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/kukhni');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('[data-header] [data-cta]').first()).toHaveAttribute('data-cta-on', '');
  });

  test('без JS: шапка и панель графитовые, hero жёлтая', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto('/kukhni');
    await page.locator('.hero__actions [data-cta]').scrollIntoViewIfNeeded();
    expect(await yellowOnScreen(page)).toEqual(['Порахувати вартість']);
    await ctx.close();
  });
});
