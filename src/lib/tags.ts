/**
 * Мост к Google Analytics 4 (gtag) и Meta Pixel (fbq). Теги подключает Analytics.astro только в боевой сборке и только
 * при заданных ID; без них все функции — пустые вызовы. Имя, телефон, текст описания и файлы сюда не передаются никогда:
 * в параметрах — только тип формы, страница, номер шага, ветка квиза, мессенджер.
 */
type Params = Record<string, string | number | boolean>;
type Gtag = (cmd: 'event', name: string, params?: Params) => void;
type Fbq = (cmd: 'track', event: string, params?: Params) => void;

function gtag(name: string, params?: Params): void {
  const g = (globalThis as unknown as { gtag?: Gtag }).gtag;
  if (typeof g === 'function') g('event', name, params);
}

function fbq(event: string, params?: Params): void {
  const f = (globalThis as unknown as { fbq?: Fbq }).fbq;
  if (typeof f === 'function') f('track', event, params);
}

/** Страница без «.html» и конечного «/»: /kukhni, главная — «/» */
export function pageName(pathname: string): string {
  return pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
}

/**
 * События квиза и сюжета из track() → GA4: quiz_start; quiz_step_N → quiz_step с параметром step = N;
 * story_complete. Остальные события dataLayer в GA4 не дублируются.
 */
export function forwardToGa4(name: string, params: Params = {}): void {
  const step = /^quiz_step_(\d+)$/.exec(name);
  if (step) gtag('quiz_step', { step: Number(step[1]), quiz_branch: String(params.quiz_branch ?? '') });
  else if (name === 'quiz_start') gtag('quiz_start', { quiz_branch: String(params.quiz_branch ?? '') });
  else if (name === 'story_complete') gtag('story_complete', params);
}

/**
 * Успешная отправка любой формы: GA4 generate_lead (form_type, page) и Pixel Lead (content_name).
 * content_name — тип формы и страница: на лендингах задан явно (planuvannya, planuvannya_mebli_zamir…),
 * иначе «форма_страница» (quiz_kukhni, zapyt_kontakty).
 */
export function leadSucceeded(formType: string, contentName?: string, pathname = location.pathname): void {
  const page = pageName(pathname);
  gtag('generate_lead', { form_type: formType, page });
  fbq('Lead', { content_name: contentName ?? `${formType}_${page === '/' ? 'home' : page.slice(1)}` });
}

/** Клик по ссылке связи: tel: → click_phone, Viber / Telegram → click_messenger; в Pixel — Contact */
export function contactClicked(href: string, pathname = location.pathname): void {
  const page = pageName(pathname);
  if (href.startsWith('tel:')) gtag('click_phone', { page });
  else if (href.startsWith('viber:')) gtag('click_messenger', { messenger: 'viber', page });
  else if (/^https:\/\/t\.me\//.test(href)) gtag('click_messenger', { messenger: 'telegram', page });
  else return;
  fbq('Contact');
}
