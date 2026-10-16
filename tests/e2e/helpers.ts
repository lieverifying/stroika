import type { Page } from '@playwright/test';

// Общие помощники e2e. Вместо фиксированных пауз — ожидание условий.

/** Жёлтый (рулетка) в computed style */
export const TAPE = 'rgb(227, 177, 44)';

/** Отключить CSS-переходы: цвет кнопки меняется мгновенно, промежуточных оттенков нет */
export async function noTransitions(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
}

/**
 * Дождаться, пока браузер отрисует два кадра. IntersectionObserver присылает записи
 * на этапе отрисовки кадра — после двух кадров правило одного жёлтого уже пересчитано.
 */
export async function nextFrames(page: Page) {
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

/** Тексты видимых на экране элементов с жёлтым фоном (логотип — <img>, не считается) */
export async function yellowOnScreen(page: Page) {
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
