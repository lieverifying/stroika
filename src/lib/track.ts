/**
 * Отправка события в window.dataLayer, в dev — ещё и в консоль; события квиза и сюжета — ещё и в GA4 (src/lib/tags.ts).
 * Имя и телефон не передаём никогда.
 */
import { forwardToGa4 } from './tags';

export type TrackParams = Record<string, string | number | boolean>;

export function track(name: string, params?: TrackParams): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  const layer = (w.dataLayer ??= []);
  layer.push({ event: name, ...params });
  forwardToGa4(name, params);
  if (import.meta.env.DEV) console.debug('[track]', name, params ?? {});
}
