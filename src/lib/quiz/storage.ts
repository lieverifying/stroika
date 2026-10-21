/**
 * Хранение состояния квиза в localStorage (ARCHITECTURE.md 4.5).
 * В хранилище попадают только белые списки полей: имя, телефон и прочие контактные данные не сохраняются.
 * Любая ошибка хранилища (приватный режим, встроенные браузеры, квота) гасится: функции не бросают.
 */
import { STEPS } from './config';
import type { QuizAnswers, QuizState, StepId } from './types';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const STORAGE_KEY = 'vymir.quiz.v1';
/** Срок жизни от updatedAt: 7 суток */
export const TTL_MS = 7 * 24 * 60 * 60 * 1000;

const ANSWER_KEYS = [
  'goal',
  'kitchenShape',
  'kitchenLength',
  'facade',
  'countertop',
  'wardrobeType',
  'wardrobeWidth',
  'otherType',
  'timing',
] as const satisfies readonly (keyof QuizAnswers)[];

/** Доступ к localStorage внутри try/catch: сам геттер может бросить */
function resolve(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function pickAnswers(raw: unknown): QuizAnswers {
  const result: Record<string, string> = {};
  if (raw && typeof raw === 'object') {
    for (const key of ANSWER_KEYS) {
      const value = (raw as Record<string, unknown>)[key];
      if (typeof value === 'string') result[key] = value;
    }
  }
  return result as QuizAnswers;
}

/** Ветки, которые сейчас есть в квизе: состояние со старой веткой (например, убранной) не восстанавливаем */
const GOALS = new Set(['kitchen', 'wardrobe', 'other']);
const TIMINGS = new Set(['within3m', '3to6m', 'later', 'unknown']);

/** Только поля из белого списка; null, если форма не похожа на состояние */
function sanitize(raw: unknown): QuizState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.version !== 1) return null;
  if (typeof r.stepId !== 'string' || !Array.isArray(r.history) || !Array.isArray(r.firedSteps)) return null;
  // Шаг убран из квиза (например, «Стільниця» или коротка форма до ТЗ v2) — прохождение не восстанавливаем
  if (!(r.stepId in STEPS) || r.history.some((x) => typeof x !== 'string' || !(x in STEPS))) return null;
  if (typeof r.startedAt !== 'number' || typeof r.updatedAt !== 'number') return null;
  const answers = pickAnswers(r.answers);
  if (answers.goal !== undefined && !GOALS.has(answers.goal)) return null;
  if (answers.timing !== undefined && !TIMINGS.has(answers.timing)) delete answers.timing;
  return {
    version: 1,
    stepId: r.stepId as StepId,
    history: r.history.filter((x): x is StepId => typeof x === 'string'),
    answers,
    started: r.started === true,
    firedSteps: r.firedSteps.filter((x): x is number => typeof x === 'number'),
    startedAt: r.startedAt,
    updatedAt: r.updatedAt,
  };
}

export function saveState(state: QuizState, storage?: StorageLike): void {
  try {
    const target = resolve(storage);
    const clean = sanitize(state);
    if (!target || !clean) return;
    target.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    /* хранилище недоступно: квиз работает без сохранения */
  }
}

export function clearState(storage?: StorageLike): void {
  try {
    resolve(storage)?.removeItem(STORAGE_KEY);
  } catch {
    /* ничего не делаем */
  }
}

export function loadState(now: number, storage?: StorageLike): QuizState | null {
  try {
    const target = resolve(storage);
    if (!target) return null;
    const raw = target.getItem(STORAGE_KEY);
    if (raw === null) return null;

    let state: QuizState | null = null;
    try {
      state = sanitize(JSON.parse(raw));
    } catch {
      state = null;
    }
    if (!state || now - state.updatedAt > TTL_MS) {
      clearState(target);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}
