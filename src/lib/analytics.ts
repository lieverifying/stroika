/**
 * Аналитика (ARCHITECTURE.md 4.7). track() — в ./track.ts (до фазы 7 только window.dataLayer).
 * Имя и телефон в события не передаём никогда.
 */
import { facts } from '../content/facts';
import { STEPS } from './quiz/config';
import type { Branch, QuizState, StepId } from './quiz/types';

export { track } from './track';

export interface QuizEvent {
  name: string;
  params: Record<string, string>;
}

/**
 * События за пройденный шаг квиза. Чистая функция: состояние не мутирует, а возвращает новое
 * (started / firedSteps), чтобы «Назад» и повторный выбор не дублировали события.
 * quiz_start — один раз за жизнь QuizState, при первом завершении шага goal.
 * variant — вариант экрана результата в A/B; по умолчанию берётся из флага facts.flags.quizResultVariant.
 */
export function quizStepEvents(
  state: QuizState,
  completedStepId: StepId,
  branch: Branch,
  variant: 'A' | 'B' = facts.flags.quizResultVariant,
): { events: QuizEvent[]; state: QuizState } {
  const events: QuizEvent[] = [];
  let started = state.started;
  let firedSteps = state.firedSteps;

  if (completedStepId === 'goal' && !started) {
    events.push({ name: 'quiz_start', params: { quiz_branch: branch, quiz_variant: variant } });
    started = true;
  }

  const n = STEPS[completedStepId].tzNumber;
  if (!firedSteps.includes(n)) {
    events.push({ name: `quiz_step_${n}`, params: { quiz_branch: branch, step_id: completedStepId } });
    firedSteps = [...firedSteps, n];
  }

  return { events, state: { ...state, started, firedSteps } };
}
