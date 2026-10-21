import { expect, test } from './fixtures';

// Блок 14 — футер
test.describe('футер', () => {
  test('ссылки с правильной схемой, зоны нажатия ≥ 48 px', async ({ page }) => {
    await page.goto('/kukhni');
    const f = page.locator('footer[data-block="14"]');
    await expect(f.locator('a[href="tel:+380759914843"]')).toHaveCount(1);
    await expect(f.locator('a[href="tel:+380759914843"]')).toContainText('+380 75 991 48 43');
    await expect(f.locator('a[href="viber://chat?number=%2B380759914843"]')).toHaveCount(1);
    await expect(f.locator('a[href="https://t.me/+380759914843"]')).toHaveCount(1);
    await expect(f.locator('a[href="https://www.instagram.com/vymir.che"]')).toHaveCount(1);
    await expect(f.locator('a[href="https://www.tiktok.com/@vymir.che"]')).toHaveCount(1);
    // режим запуска: почты, графика и адреса нет, пока нет фактов; ФОП — только в политике
    await expect(f.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(f).not.toContainText(/ФОП|ІПН/);
    await expect(f.locator('.fact-ph')).toHaveCount(0);
    await expect(f.locator('a[href="/polityka"]')).toHaveCount(1);
    for (const a of await f.locator('a').all()) {
      expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('телефон: низ футера не перекрыт нижней панелью', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const footerBottom = await page.locator('footer[data-block="14"]').evaluate((el) => el.getBoundingClientRect().bottom);
    const barTop = await page.locator('[data-bottom-bar]').evaluate((el) => el.getBoundingClientRect().top);
    expect(footerBottom).toBeLessThanOrEqual(barTop + 1);
  });
});
