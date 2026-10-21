import { factDefaults, type Fact, type Missing, type Placeholder } from '../content/facts';

/** Факта нет: missing('NAME') — блок не выводим. */
export function isMissing(value: unknown): value is Missing {
  return typeof value === 'object' && value !== null && typeof (value as Missing).missing === 'string';
}

/** Значения ещё нет: заглушка '{{NAME}}' или missing('NAME'). Логика «есть ли факт» во всём коде — через неё. */
export function isPlaceholder(value: unknown): value is Placeholder | Missing {
  return isMissing(value) || (typeof value === 'string' && /^\{\{[A-Z0-9_]+\}\}$/.test(value));
}

/** Факт есть — можно показывать */
export const has = <T>(value: Fact<T>): value is T => !isPlaceholder(value);

/** Имя заглушки без скобок: '{{WARRANTY_YEARS}}' → 'WARRANTY_YEARS'. */
export function placeholderName(value: Placeholder | Missing): string {
  return isMissing(value) ? value.missing : value.slice(2, -2);
}

/**
 * Текст факта или значение по умолчанию из factDefaults, если факт — заглушка.
 * pending — имя заглушки (для data-fact-default и отчёта check-placeholders) или null.
 */
export function withDefault(value: Fact<string>): { text: string; pending: string | null } {
  if (!isPlaceholder(value)) return { text: value, pending: null };
  const name = placeholderName(value);
  return { text: factDefaults[name] ?? (isMissing(value) ? '' : value), pending: name };
}

/** Число или null, если вместо числа заглушка (тогда расчёт откатывается). */
export function num(value: Fact<number>): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

const NNBSP = ' '; // узкий неразрывный пробел между разрядами

/** 45000 → «45 000 грн». Символ ₴ не используем (CLAUDE.md). */
export function formatUAH(n: number): string {
  const digits = Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  return `${digits} грн`;
}

/** Ссылки связи. С заглушкой ссылка нерабочая, но видно, что место ждёт данных (ARCHITECTURE.md 5.3). */
const str = (v: Fact<string>) => (isMissing(v) ? '' : v);
export const telHref = (e164: Fact<string>) => `tel:${str(e164)}`;
export const viberHref = (e164: Fact<string>) =>
  isPlaceholder(e164) ? `viber://chat?number=${str(e164)}` : `viber://chat?number=${encodeURIComponent(e164)}`;
export const telegramHref = (username: Fact<string>) => `https://t.me/${str(username)}`;

/** '+380671234567' → '+380 67 123 45 67'. Заглушку возвращает как есть. */
export function formatPhone(e164: Fact<string>): string {
  if (isPlaceholder(e164)) return isMissing(e164) ? '' : e164;
  const m = /^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `+380 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

/**
 * Форма слова после числа: pluralUk(2, ['рік', 'роки', 'років']) → 'роки'.
 * Для заглушки — форма «багато» (5–20), её ж выводим и до подтверждения числа.
 */
export function pluralUk(value: Fact<number> | string, forms: [one: string, few: string, many: string]): string {
  // string — заглушка из файла кейса (схема Zod даёт string, а не шаблонный тип)
  const n = typeof value === 'number' ? num(value) : null;
  if (n === null) return forms[2];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
