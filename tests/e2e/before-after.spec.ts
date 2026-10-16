import { expect, test } from '@playwright/test';

// Блок 4 — слайдер «було / стало»
test.describe('було / стало', () => {
  test('клавиатура: стрелки двигают сравнение', async ({ page }) => {
    await page.goto('/');
    const range = page.locator('.ba__range').first();
    await range.focus();
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect(range).toHaveValue('60');
    const pos = await page.locator('[data-before-after]').first().evaluate((el) => el.style.getPropertyValue('--pos'));
    expect(pos).toBe('60%');
  });

  test('ручку можно тянуть, страница вбок не едет', async ({ page }) => {
    await page.goto('/');
    const fig = page.locator('[data-before-after]').first();
    await fig.scrollIntoViewIfNeeded();
    const knob = (await fig.locator('.ba__knob').boundingBox())!;
    expect(knob.width).toBeGreaterThanOrEqual(48);
    const x = knob.x + knob.width / 2;
    const y = knob.y + knob.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 80, y, { steps: 8 });
    await page.mouse.up();
    expect(Number(await fig.locator('.ba__range').inputValue())).toBeLessThan(50);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test('телефон: ручка тянется пальцем (touch-события)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'только телефон');
  await page.goto('/');
  const fig = page.locator('[data-before-after]').first();
  await fig.scrollIntoViewIfNeeded();
  const knob = (await fig.locator('.ba__knob').boundingBox())!;
  const x = Math.round(knob.x + knob.width / 2);
  const y = Math.round(knob.y + knob.height / 2);
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', px: number) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: px, y }] });
  await touch('touchStart', x);
  for (let i = 1; i <= 8; i++) await touch('touchMove', x + i * 10);
  await touch('touchEnd', x + 80);
  expect(Number(await fig.locator('.ba__range').inputValue())).toBeGreaterThan(50);
});
