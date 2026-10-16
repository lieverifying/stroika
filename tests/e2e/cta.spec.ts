import { expect, test, type Page } from '@playwright/test';

// Правило «один жёлтый элемент на экран» (ARCHITECTURE.md 6.9).
// Считаем видимые элементы с жёлтым фоном. Логотип (жёлтый угольник в <img>) не считается — решение владельца.
const TAPE = 'rgb(227, 177, 44)';

async function yellowOnScreen(page: Page) {
  return page.evaluate((tape) => {
    const vh = window.innerHeight;
    return [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => getComputedStyle(el).backgroundColor === tape)
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh;
      })
      .map((el) => el.textContent?.trim() ?? '');
  }, TAPE);
}

test.describe('один жёлтый на экран', () => {
  test('в разных точках прокрутки жёлтых элементов не больше одного', async ({ page }) => {
    await page.goto('/');
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(150); // IntersectionObserver и переход цвета
      const yellow = await yellowOnScreen(page);
      expect(yellow.length, `y=${y}: ${yellow.join(' | ')}`).toBeLessThanOrEqual(1);
    }
  });

  test('первый экран: жёлтая — кнопка hero', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(200);
    expect(await yellowOnScreen(page)).toEqual(['Розрахувати вартість']);
  });

  test('телефон: ниже hero жёлтой становится «Розрахувати» в панели', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('[data-bottom-bar] [data-cta]')).toHaveAttribute('data-cta-on', '');
  });

  test('десктоп: ниже hero жёлтой становится кнопка шапки', async ({ page, isMobile }) => {
    test.skip(isMobile, 'только десктоп');
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator('[data-header] [data-cta]').first()).toHaveAttribute('data-cta-on', '');
  });

  test('без JS: шапка и панель графитовые, hero жёлтая', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
    const page = await ctx.newPage();
    await page.goto('/');
    expect(await yellowOnScreen(page)).toEqual(['Розрахувати вартість']);
    await ctx.close();
  });
});
