/**
 * Две посадочные (решение владельца, 2026-10-21): /kukhni и /mebli. «/» — экран выбора.
 * Посадочная определяет, куда ведут «Розрахувати» и «Безкоштовний замір», какая ветка квиза выбрана
 * и какой страницей-источником помечена заявка в аналитике (kukhni или mebli).
 */
export type Landing = 'kukhni' | 'mebli';

/**
 * Адрес страницы без «.html» и конечного «/»: при сборке (build.format = 'file') Astro.url.pathname — '/kukhni.html',
 * в dev — '/kukhni'. Главная — '/'.
 */
export function pagePath(url: URL): string {
  return url.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
}

/** Посадочная по адресу; для остальных страниц — null */
export function landingOfPath(path: string): Landing | null {
  if (path === '/kukhni' || path.startsWith('/kukhni/')) return 'kukhni';
  if (path === '/mebli' || path.startsWith('/mebli/')) return 'mebli';
  return null;
}

/** Ссылки «в квиз» и «на замер»: на посадочной — на ней же, на остальных страницах — на /kukhni */
export const quizHref = (landing: Landing | null) => `/${landing ?? 'kukhni'}#kvyz`;
export const zamirHref = (landing: Landing | null) => `/${landing ?? 'kukhni'}#zamir`;

const KEY = 'vymir.landing';

/**
 * Посадочная-источник заявки (в браузере): текущая страница или последняя посещённая посадочная в этой вкладке.
 * Если человек не был ни на одной посадочной (например, сразу открыл /kontakty) — 'none'.
 */
export function leadLanding(): Landing | 'none' {
  try {
    const here = document.body.dataset.landing as Landing | undefined;
    if (here) {
      sessionStorage.setItem(KEY, here);
      return here;
    }
    const saved = sessionStorage.getItem(KEY);
    return saved === 'kukhni' || saved === 'mebli' ? saved : 'none';
  } catch {
    return (document.body.dataset.landing as Landing | undefined) ?? 'none';
  }
}
