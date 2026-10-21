/**
 * Источник заявки (ARCHITECTURE.md 7.1): utm_*, fbclid, gclid, referrer и первая страница визита.
 * Сохраняются при заходе на любую страницу (last-touch: новые utm перезаписывают старые) в sessionStorage.
 */
const KEY = 'vymir.utm';
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number] | 'referrer' | 'landingPage', string>>;

export function captureAttribution(url: URL, referrer: string, storage: Pick<Storage, 'getItem' | 'setItem'> = sessionStorage): void {
  try {
    const fromUrl: Attribution = {};
    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) fromUrl[p] = v.slice(0, 300);
    }
    const saved = readAttribution(storage);
    const external = referrer && !referrer.startsWith(url.origin) ? referrer.slice(0, 300) : '';
    if (Object.keys(fromUrl).length) {
      storage.setItem(KEY, JSON.stringify({ ...fromUrl, referrer: external || saved.referrer, landingPage: url.pathname }));
    } else if (!saved.landingPage) {
      storage.setItem(KEY, JSON.stringify({ referrer: external, landingPage: url.pathname }));
    }
  } catch {
    /* хранилище недоступно — источник просто не узнаем */
  }
}

export function readAttribution(storage: Pick<Storage, 'getItem'> = sessionStorage): Attribution {
  try {
    const v = JSON.parse(storage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? (v as Attribution) : {};
  } catch {
    return {};
  }
}
