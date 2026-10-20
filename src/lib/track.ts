/**
 * Отправка события в window.dataLayer (его подхватит GTM), в dev — ещё и в консоль.
 * Без импортов: модуль подключают лёгкие скрипты страниц, которым не нужен квиз. Имя и телефон не передаём никогда.
 */
export type TrackParams = Record<string, string | number | boolean>;

export function track(name: string, params?: TrackParams): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  const layer = (w.dataLayer ??= []);
  layer.push({ event: name, ...params });
  if (import.meta.env.DEV) console.debug('[track]', name, params ?? {});
}
