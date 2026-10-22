/**
 * Meta Pixel: событие Lead после успешной отправки заявки. Сам Pixel подключается в фазе 7 (META_PIXEL_ID);
 * пока его нет на странице, вызов ничего не делает. Имя и телефон не передаём никогда.
 */
type Fbq = (cmd: 'track', event: string, params?: Record<string, string>) => void;

export function pixelLead(contentName: string): void {
  if (typeof window === 'undefined') return;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  if (typeof fbq === 'function') fbq('track', 'Lead', { content_name: contentName });
}
