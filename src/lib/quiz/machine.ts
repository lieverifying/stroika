/**
 * Конечный автомат квиза (ARCHITECTURE.md 4.2): чистые иммутабельные функции, без DOM.
 * Ответ на single-шаг записывается под ключом, равным id шага.
 */
import { BRANCH_FIELDS, PATHS, STEPS, branchOf } from './config';
import type { Branch, QuizAnswers, QuizState, StepId } from './types';

const BRANCHES: Branch[] = ['kitchen', 'wardrobe', 'other'];
/** Пока ветка не выбрана, прогресс считаем по самому длинному пути (кухня) */
const DEFAULT_BRANCH: Branch = 'kitchen';

export function start(now: number, preset?: Partial<QuizAnswers>): QuizState {
  return {
    version: 1,
    stepId: 'goal',
    history: [],
    answers: { ...(preset ?? {}) },
    started: false,
    firedSteps: [],
    startedAt: now,
    updatedAt: now,
  };
}

/** Удаляет поля веток, которых нет в новой ветке (общие поля, например timing, остаются) */
function dropForeignFields(answers: QuizAnswers, keep: Branch): QuizAnswers {
  const result = { ...answers };
  for (const branch of BRANCHES) {
    if (branch === keep) continue;
    for (const field of BRANCH_FIELDS[branch]) {
      if (!BRANCH_FIELDS[keep].includes(field)) delete result[field];
    }
  }
  return result;
}

/** Записывает ответ на текущий single-шаг и переходит дальше. На contact бросает ошибку. */
export function answer(state: QuizState, value: string, now: number): QuizState {
  const step = STEPS[state.stepId];
  if (step.kind !== 'single') {
    throw new Error(`Шаг «${state.stepId}» не имеет выбора одного варианта`);
  }

  let answers: QuizAnswers = { ...state.answers, [state.stepId]: value };
  if (state.stepId === 'goal') {
    const prev = branchOf(state.answers.goal);
    const next = branchOf(answers.goal);
    if (next && prev !== next) answers = dropForeignFields(answers, next);
  }

  const target = step.next(answers);
  // single-шаги всегда ведут на другой шаг; 'submit' достижим только с contact
  if (target === 'submit') throw new Error(`Шаг «${state.stepId}» завершает квиз`);

  return {
    ...state,
    stepId: target,
    history: [...state.history, state.stepId],
    answers,
    updatedAt: now,
  };
}

/** Шаг назад; ответы сохраняются, чтобы выбранный вариант остался отмеченным */
export function back(state: QuizState, now: number): QuizState {
  if (state.history.length === 0) return state;
  const history = state.history.slice(0, -1);
  return { ...state, stepId: state.history[state.history.length - 1], history, updatedAt: now };
}

export function currentPath(answers: QuizAnswers): StepId[] {
  return PATHS[branchOf(answers.goal) ?? DEFAULT_BRANCH];
}

export function progress(state: QuizState): { current: number; total: number } {
  const path = currentPath(state.answers);
  return { current: path.indexOf(state.stepId) + 1, total: path.length };
}

export function isLastStep(state: QuizState): boolean {
  return STEPS[state.stepId].next(state.answers) === 'submit';
}
