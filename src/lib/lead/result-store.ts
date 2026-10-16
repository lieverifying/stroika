/**
 * Передача результата квиза на /dyakuyemo через sessionStorage (ARCHITECTURE.md 4.4–4.5).
 * Ключ vymir.quiz.result живёт до закрытия вкладки и удаляется после показа. Хранилище может быть недоступно —
 * тогда /dyakuyemo покажет общий текст.
 */
import type { QuizResult } from '../quiz/types';

export const RESULT_KEY = 'vymir.quiz.result';

export function saveResult(result: QuizResult | null): void {
  try {
    if (result) sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
    else sessionStorage.removeItem(RESULT_KEY);
  } catch {
    // приватный режим / in-app браузер — без результата
  }
}

/** Прочитать и сразу удалить результат («после показа») */
export function takeResult(): QuizResult | null {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    sessionStorage.removeItem(RESULT_KEY);
    const r = raw ? (JSON.parse(raw) as QuizResult) : null;
    return r && (r.variant === 'A' || r.variant === 'B') ? r : null;
  } catch {
    return null;
  }
}
