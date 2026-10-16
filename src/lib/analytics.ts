/**
 * Аналитика (ARCHITECTURE.md 4.7). До фазы 7 track() только кладёт событие в window.dataLayer
 * (его подхватит GTM) и в dev пишет в консоль. Имя и телефон в события не передаём никогда.
 */
import { facts } from '../content/facts';
import { STEPS } from './quiz/config';
import type { Branch, QuizState, StepId } from './quiz/types';

type Params = Record<string, string | number | boolean>;

export function track(name: string, params?: Params): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  const layer = (w.dataLayer ??= []);
  layer.push({ event: name, ...params });
  if (import.meta.env.DEV) console.debug('[track]', name, params ?? {});
}

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
