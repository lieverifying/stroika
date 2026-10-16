// Юнит-тесты конечного автомата квиза (ARCHITECTURE 4.2): чистые функции, без DOM
import { describe, expect, test } from 'vitest';
import { BRANCH_FIELDS, PATHS } from '../../src/lib/quiz/config';
import { answer, back, currentPath, isLastStep, progress, setTask, start } from '../../src/lib/quiz/machine';
import type { Branch, QuizState, StepId } from '../../src/lib/quiz/types';

const T0 = 1_000;

/** Ответы для прохода каждой ветки: [goal, ...значения single-шагов] */
const WALKS: Record<string, { branch: Branch; values: string[] }> = {
  kitchen: { branch: 'kitchen', values: ['kitchen', 'kutova', '3to4', 'mdf-film', 'quartz', '1to3m'] },
  wardrobe: { branch: 'wardrobe', values: ['wardrobe', 'kupe', 'unknown', 'later'] },
  other: { branch: 'short', values: ['other'] },
  renovation: { branch: 'short', values: ['renovation'] },
};

/** Проходит ветку до конца, возвращает пройденные шаги и все промежуточные состояния */
function walk(values: string[]) {
  let s = start(T0);
  const visited: StepId[] = [s.stepId];
  const states: QuizState[] = [s];
  values.forEach((v, i) => {
    s = answer(s, v, T0 + i + 1);
    visited.push(s.stepId);
    states.push(s);
  });
  return { final: s, visited, states };
}

describe('start', () => {
  test('начальное состояние', () => {
    expect(start(T0)).toEqual({
      version: 1,
      stepId: 'goal',
      history: [],
      answers: {},
      started: false,
      firedSteps: [],
      startedAt: T0,
      updatedAt: T0,
    });
  });

  test('preset: ответ выбран заранее, шаг остаётся goal', () => {
    const s = start(T0, { goal: 'wardrobe' });
    expect(s.stepId).toBe('goal');
    expect(s.answers).toEqual({ goal: 'wardrobe' });
    expect(s.history).toEqual([]);
  });

  test('preset не делит ссылку с состоянием', () => {
    const preset = { goal: 'kitchen' as const };
    const s = start(T0, preset);
    expect(s.answers).not.toBe(preset);
  });
});

describe('прохождение веток совпадает с PATHS', () => {
  for (const [name, { branch, values }] of Object.entries(WALKS)) {
    test(`${name}`, () => {
      const { final, visited } = walk(values);
      // последний шаг ветки — contact / shortForm; путь = PATHS
      expect(visited).toEqual(PATHS[branch]);
      expect(isLastStep(final)).toBe(true);
      expect(currentPath(final.answers)).toEqual(PATHS[branch]);
    });
  }

  test('длины: кухня 7, шафа 5, коротка 2', () => {
    expect(walk(WALKS.kitchen.values).visited).toHaveLength(7);
    expect(walk(WALKS.wardrobe.values).visited).toHaveLength(5);
    expect(walk(WALKS.other.values).visited).toHaveLength(2);
    expect(walk(WALKS.renovation.values).visited).toHaveLength(2);
  });

  test('isLastStep false на промежуточных шагах', () => {
    const { states } = walk(WALKS.kitchen.values);
    expect(states.slice(0, -1).every((s) => !isLastStep(s))).toBe(true);
  });

  test('ответ записывается под ключом, равным id шага', () => {
    const { final } = walk(WALKS.kitchen.values);
    expect(final.answers).toEqual({
      goal: 'kitchen',
      kitchenShape: 'kutova',
      kitchenLength: '3to4',
      facade: 'mdf-film',
      countertop: 'quartz',
      timing: '1to3m',
    });
  });
});

describe('«Назад»', () => {
  for (const [name, { values }] of Object.entries(WALKS)) {
    test(`с каждого шага ветки ${name} — на предыдущий, ответ сохранён`, () => {
      const { states } = walk(values);
      for (let i = states.length - 1; i > 0; i--) {
        const prev = states[i - 1];
        const b = back(states[i], T0 + 100);
        expect(b.stepId).toBe(prev.stepId);
        expect(b.history).toEqual(prev.history);
        // выбранный ранее вариант остаётся отмеченным
        expect(b.answers).toEqual(states[i].answers);
        const key = prev.stepId as keyof typeof b.answers;
        expect(b.answers[key]).toBe(values[i - 1]);
        expect(b.updatedAt).toBe(T0 + 100);
      }
    });
  }

  test('на goal с пустой историей возвращает то же состояние', () => {
    const s = start(T0);
    expect(back(s, T0 + 5)).toBe(s);
  });
});

describe('смена ветки на шаге 1', () => {
  test('удаляет ответы чужих веток', () => {
    const { states } = walk(WALKS.kitchen.values);
    let s = states[states.length - 1];
    s = back(back(back(back(back(back(s, 1), 1), 1), 1), 1), 1);
    expect(s.stepId).toBe('goal');
    s = answer(s, 'wardrobe', 2);
    expect(s.stepId).toBe('wardrobeType');
    // timing входит в поля обеих веток (kitchen и wardrobe), поэтому общий ответ остаётся
    expect(s.answers).toEqual({ goal: 'wardrobe', timing: '1to3m' });
  });

  test('кухня -> шафа: уникальные поля кухни удалены', () => {
    const { states } = walk(WALKS.kitchen.values);
    let s = states[states.length - 1];
    for (let i = 0; i < 6; i++) s = back(s, 1);
    s = answer(s, 'wardrobe', 2);
    for (const f of ['kitchenShape', 'kitchenLength', 'facade', 'countertop'] as const) {
      expect(s.answers[f]).toBeUndefined();
    }
  });

  test('шафа -> коротка: удаляются ответы шафы, task не трогается', () => {
    const { states } = walk(WALKS.wardrobe.values);
    let s = states[states.length - 1];
    for (let i = 0; i < 4; i++) s = back(s, 1);
    s = answer(s, 'other', 2);
    expect(s.stepId).toBe('shortForm');
    expect(s.answers).toEqual({ goal: 'other' });
  });

  test('other -> renovation: ветка та же, task сохраняется', () => {
    let s = answer(start(T0), 'other', 1);
    s = setTask(s, 'Тумба в передпокій', 2);
    s = back(s, 3);
    s = answer(s, 'renovation', 4);
    expect(s.answers).toEqual({ goal: 'renovation', task: 'Тумба в передпокій' });
  });

  test('тот же goal повторно: ответы ветки сохраняются', () => {
    const { states } = walk(WALKS.kitchen.values);
    let s = states[states.length - 1];
    for (let i = 0; i < 6; i++) s = back(s, 1);
    const before = { ...s.answers };
    s = answer(s, 'kitchen', 2);
    expect(s.answers).toEqual(before);
    expect(s.stepId).toBe('kitchenShape');
  });

  test('первый выбор goal не удаляет ничего лишнего', () => {
    const s = answer(start(T0), 'kitchen', 1);
    expect(s.answers).toEqual({ goal: 'kitchen' });
  });

  test('BRANCH_FIELDS: после смены на short нет ни одного поля кухни и шафы', () => {
    const { states } = walk(WALKS.kitchen.values);
    let s = states[states.length - 1];
    for (let i = 0; i < 6; i++) s = back(s, 1);
    s = answer(s, 'renovation', 2);
    for (const f of [...BRANCH_FIELDS.kitchen, ...BRANCH_FIELDS.wardrobe]) {
      expect(s.answers[f]).toBeUndefined();
    }
  });
});

describe('answer: некорректные шаги', () => {
  test('на contact бросает ошибку', () => {
    const { final } = walk(WALKS.kitchen.values);
    expect(final.stepId).toBe('contact');
    expect(() => answer(final, 'x', 1)).toThrow();
  });

  test('на shortForm бросает ошибку', () => {
    const { final } = walk(WALKS.other.values);
    expect(() => answer(final, 'x', 1)).toThrow();
  });
});

describe('setTask', () => {
  test('сохраняет текст задачи и updatedAt', () => {
    const s0 = answer(start(T0), 'other', 1);
    const s = setTask(s0, 'Шафа в нішу', 50);
    expect(s.answers.task).toBe('Шафа в нішу');
    expect(s.updatedAt).toBe(50);
    expect(s.stepId).toBe('shortForm');
  });
});

describe('progress', () => {
  test('старт: 1/7', () => {
    expect(progress(start(T0))).toEqual({ current: 1, total: 7 });
  });

  test('preset с известной веткой: 1/5', () => {
    expect(progress(start(T0, { goal: 'wardrobe' }))).toEqual({ current: 1, total: 5 });
  });

  test('шафа: 1/7 -> 2/5', () => {
    const s0 = start(T0);
    expect(progress(s0)).toEqual({ current: 1, total: 7 });
    expect(progress(answer(s0, 'wardrobe', 1))).toEqual({ current: 2, total: 5 });
  });

  test('кухня: 1/7 -> 2/7', () => {
    expect(progress(answer(start(T0), 'kitchen', 1))).toEqual({ current: 2, total: 7 });
  });

  test('коротка: 2/2', () => {
    expect(progress(answer(start(T0), 'other', 1))).toEqual({ current: 2, total: 2 });
    expect(progress(answer(start(T0), 'renovation', 1))).toEqual({ current: 2, total: 2 });
  });

  test('последний шаг каждой ветки: current == total', () => {
    for (const { values } of Object.values(WALKS)) {
      const p = progress(walk(values).final);
      expect(p.current).toBe(p.total);
    }
  });
});

describe('currentPath', () => {
  test('без ветки — путь кухни', () => {
    expect(currentPath({})).toEqual(PATHS.kitchen);
  });
});

describe('иммутабельность', () => {
  test('answer/back/setTask не мутируют входное состояние', () => {
    const s0 = answer(start(T0), 'kitchen', 1);
    const snap = structuredClone(s0);
    const s1 = answer(s0, 'kutova', 2);
    expect(s0).toEqual(snap);
    expect(s1).not.toBe(s0);
    expect(s1.history).not.toBe(s0.history);
    expect(s1.answers).not.toBe(s0.answers);
    back(s1, 3);
    expect(s1.history).toEqual(['goal', 'kitchenShape']);
    const t0 = answer(start(T0), 'other', 1);
    const tSnap = structuredClone(t0);
    setTask(t0, 'x', 2);
    expect(t0).toEqual(tSnap);
  });

  test('смена ветки не мутирует исходные ответы', () => {
    const { states } = walk(WALKS.kitchen.values);
    let s = states[states.length - 1];
    for (let i = 0; i < 6; i++) s = back(s, 1);
    const snap = structuredClone(s);
    answer(s, 'wardrobe', 9);
    expect(s).toEqual(snap);
  });
});
