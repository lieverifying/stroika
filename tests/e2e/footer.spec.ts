import { expect, test } from './fixtures';

// Блок 14 — футер
test.describe('футер', () => {
  test('ссылки с правильной схемой, зоны нажатия ≥ 48 px; ФОП, почты, графика и адреса нет', async ({ page, isMobile }) => {
    await page.goto('/kukhni');
    const f = page.locator('footer[data-block="14"]');
    const visible = (sel: string) => f.locator(`${sel}:visible`);
    await expect(visible('a[href="tel:+380759914883"]')).toHaveCount(1);
    await expect(visible('a[href="viber://chat?number=%2B380759914883"]')).toHaveCount(1);
    await expect(visible('a[href="https://t.me/+380759914883"]')).toHaveCount(1);
    await expect(visible('a[href="https://www.instagram.com/vymir.che"]')).toHaveCount(1);
    await expect(visible('a[href="https://www.tiktok.com/@vymir.che"]')).toHaveCount(1);
    if (!isMobile) await expect(visible('a[href="tel:+380759914883"]')).toContainText('+380 75 991 48 83');
    await expect(visible('a[href^="mailto:"]')).toHaveCount(0);
    await expect(f).not.toContainText(/ФОП|ІПН/);
    await expect(f.locator('.fact-ph')).toHaveCount(0);
    await expect(visible('a[href="/polityka"]')).toHaveCount(1);
    for (const a of await visible('a').all()) {
      expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(48);
    }
  });

  test('телефон: компактный подвал — логотип, одна строка иконок, «Черкаси та область», политика; без крупных кнопок и слогана', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'только телефон');
    await page.goto('/kukhni');
    const f = page.locator('footer[data-block="14"]');
    await expect(f.locator('[data-footer-compact]')).toBeVisible();
    await expect(f.locator('[data-footer-full]').first()).toBeHidden();
    const icons = f.locator('.site-footer__icon');
    await expect(icons).toHaveCount(5);
    const tops = await icons.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBe(1); // одна строка
    for (const label of ['Viber', 'Telegram', 'Instagram', 'TikTok']) await expect(f.getByRole('link', { name: label, exact: true })).toBeVisible();
    await expect(f.getByRole('link', { name: /Подзвонити/ })).toHaveAttribute('href', 'tel:+380759914883');
    await expect(f.locator('[data-footer-compact]')).toContainText('Черкаси та область');
    await expect(f.locator('.btn:visible')).toHaveCount(0);
    await expect(f.locator('.site-footer__slogan:visible')).toHaveCount(0);
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
