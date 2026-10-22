/**
 * Передача данных для /dyakuyemo через sessionStorage (ARCHITECTURE.md 4.4–4.5): имя, способ связи и результат квиза.
 * Ключ vymir.lead.thanks живёт до закрытия вкладки и удаляется сразу после показа. Телефон сюда не пишется никогда.
 * Хранилище может быть недоступно — тогда /dyakuyemo покажет общий текст.
 */
import type { ContactMethod, QuizResult } from '../quiz/types';

export const THANKS_KEY = 'vymir.lead.thanks';

export interface ThanksData {
  name: string;
  method: ContactMethod;
  /** null — заявка не из квиза (форма замера, нестандартный запрос) */
  result: QuizResult | null;
  /** Лид-магниты: 'plan' — /planuvannya, 'plan_mebli' — /planuvannya-mebli; на /dyakuyemo свой текст */
  kind?: 'plan' | 'plan_mebli';
}

const METHODS: ContactMethod[] = ['viber', 'telegram', 'call'];

/** Значение поля «Як зв’язатися» → способ связи; всё незнакомое — звонок */
export function toMethod(value: unknown): ContactMethod {
  return METHODS.includes(value as ContactMethod) ? (value as ContactMethod) : 'call';
}

export function saveThanks(data: ThanksData): void {
  try {
    sessionStorage.setItem(THANKS_KEY, JSON.stringify(data));
  } catch {
    // приватный режим / in-app браузер — без персонального текста
  }
}

/** Прочитать и сразу удалить («после показа»). Неполные данные отбрасываются. */
export function takeThanks(): ThanksData | null {
  try {
    const raw = sessionStorage.getItem(THANKS_KEY);
    sessionStorage.removeItem(THANKS_KEY);
    const d = raw ? (JSON.parse(raw) as Partial<ThanksData>) : null;
    if (!d || typeof d.name !== 'string') return null;
    const r = d.result;
    const result = r && (r.variant === 'A' || r.variant === 'B') ? r : null;
    const kind = d.kind === 'plan' || d.kind === 'plan_mebli' ? d.kind : undefined;
    return { name: d.name.slice(0, 50), method: toMethod(d.method), result, ...(kind ? { kind } : {}) };
  } catch {
    return null;
  }
}

/** Как назвать канал в тексте «Надішлемо розрахунок у …» */
export const CHANNEL_LABEL: Record<Exclude<ContactMethod, 'call'>, string> = { viber: 'Viber', telegram: 'Telegram' };
