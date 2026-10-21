// Юнит-тесты аналитики: track() и события шагов квиза (ARCHITECTURE 4.7)
import { afterEach, describe, expect, test, vi } from 'vitest';
import { quizStepEvents, track } from '../../src/lib/analytics';
import { PATHS, HAS_WARDROBE_WIDTH } from '../../src/lib/quiz/config';
import { answer, back, start } from '../../src/lib/quiz/machine';
import type { Branch, QuizState } from '../../src/lib/quiz/types';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('track', () => {
  test('без window — ничего не делает и не падает', () => {
    expect(() => track('x')).not.toThrow();
  });
  test('создаёт dataLayer и пушит событие с параметрами', () => {
    const win: { dataLayer?: unknown[] } = {};
    vi.stubGlobal('window', win);
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    track('quiz_start', { quiz_branch: 'kitchen', n: 1, ok: true });
    track('plain');
    expect(win.dataLayer).toEqual([{ event: 'quiz_start', quiz_branch: 'kitchen', n: 1, ok: true }, { event: 'plain' }]);
  });
  test('дописывает в существующий dataLayer', () => {
    const existing = [{ event: 'old' }];
    vi.stubGlobal('window', { dataLayer: existing });
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    track('new');
    expect(existing).toEqual([{ event: 'old' }, { event: 'new' }]);
  });
  test('в dev логирует в консоль', () => {
    vi.stubGlobal('window', {});
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    track('dev_evt');
    expect(spy).toHaveBeenCalledTimes(1);
  });
  test('не в dev — консоль молчит', () => {
    vi.stubEnv('DEV', false);
    vi.stubGlobal('window', {});
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    track('prod_evt');
    expect(spy).not.toHaveBeenCalled();
  });
});

/** Проходит ветку через машину, собирая события; возвращает имена по порядку */
function walk(branch: Branch, values: string[], variant?: 'A' | 'B') {
  let state: QuizState = start(0);
  const events: { name: string; params: Record<string, string> }[] = [];
  for (const value of values) {
    const stepId = state.stepId;
    const r = quizStepEvents(state, stepId, branch, variant);
    state = { ...answer(state, value, 1), started: r.state.started, firedSteps: r.state.firedSteps };
    events.push(...r.events);
  }
  return { state, events };
}

describe('quizStepEvents', () => {
  const wardrobe = HAS_WARDROBE_WIDTH ? ['wardrobe', 'kupe', 'unknown', 'later'] : ['wardrobe', 'kupe', 'later'];

  test('ветка шафи: quiz_start, 1, 2, [3, если есть шаг ширины], 6 (и 7 на контакте)', () => {
    const { events, state } = walk('wardrobe', wardrobe);
    const steps = HAS_WARDROBE_WIDTH ? [1, 2, 3, 6] : [1, 2, 6];
    expect(events.map((e) => e.name)).toEqual(['quiz_start', ...steps.map((n) => `quiz_step_${n}`)]);
    const contact = quizStepEvents(state, 'contact', 'wardrobe');
    expect(contact.events.map((e) => e.name)).toEqual(['quiz_step_7']);
  });
  test('кухня даёт шаги 1–7', () => {
    const { events, state } = walk('kitchen', ['kitchen', 'kutova', '3to4', 'dsp', 'quartz', '1to3m']);
    const all = [...events, ...quizStepEvents(state, 'contact', 'kitchen').events];
    expect(all.map((e) => e.name)).toEqual(['quiz_start', ...[1, 2, 3, 4, 5, 6, 7].map((n) => `quiz_step_${n}`)]);
  });
  test('короткая форма: 1 и 7', () => {
    const { events, state } = walk('short', ['other']);
    const all = [...events, ...quizStepEvents(state, 'shortForm', 'short').events];
    expect(all.map((e) => e.name)).toEqual(['quiz_start', 'quiz_step_1', 'quiz_step_7']);
  });
  test('все шаги ветки покрыты tzNumber из PATHS', () => {
    const { events, state } = walk('wardrobe', wardrobe);
    const n = events.length + quizStepEvents(state, 'contact', 'wardrobe').events.length;
    expect(n).toBe(PATHS.wardrobe.length + 1);
  });
  test('параметры: ветка, шаг, вариант', () => {
    const { events } = walk('wardrobe', wardrobe.slice(0, 2), 'A');
    expect(events[0]).toEqual({ name: 'quiz_start', params: { quiz_branch: 'wardrobe', quiz_variant: 'A' } });
    expect(events[1]).toEqual({ name: 'quiz_step_1', params: { quiz_branch: 'wardrobe', step_id: 'goal' } });
    expect(events[2]).toEqual({ name: 'quiz_step_2', params: { quiz_branch: 'wardrobe', step_id: 'wardrobeType' } });
  });
  test('вариант по умолчанию — из флага facts (B)', () => {
    const { events } = walk('wardrobe', ['wardrobe']);
    expect(events[0].params.quiz_variant).toBe('B');
  });
  test('«Назад» и повторный выбор не дублируют события', () => {
    let state = start(0);
    const names: string[] = [];
    const step = (value: string) => {
      const r = quizStepEvents(state, state.stepId, 'wardrobe');
      names.push(...r.events.map((e) => e.name));
      state = { ...answer(state, value, 1), started: r.state.started, firedSteps: r.state.firedSteps };
    };
    step('wardrobe');
    step('kupe');
    state = back(state, 2);
    step('rozpashna');
    state = back(back(state, 3), 4);
    step('wardrobe');
    expect(names).toEqual(['quiz_start', 'quiz_step_1', 'quiz_step_2']);
  });
  test('не мутирует переданное состояние', () => {
    const s = start(0);
    const snapshot = JSON.stringify(s);
    const r = quizStepEvents(s, 'goal', 'kitchen');
    expect(JSON.stringify(s)).toBe(snapshot);
    expect(r.state.started).toBe(true);
    expect(r.state.firedSteps).toEqual([1]);
  });
  test('уже started: quiz_start не повторяется даже на goal', () => {
    const s: QuizState = { ...start(0), started: true };
    const r = quizStepEvents(s, 'goal', 'kitchen');
    expect(r.events.map((e) => e.name)).toEqual(['quiz_step_1']);
  });
  test('в параметрах нет имени и телефона', () => {
    const { events } = walk('kitchen', ['kitchen', 'kutova', '3to4', 'dsp', 'quartz', '1to3m']);
    for (const e of events) {
      expect(Object.keys(e.params).join()).not.toMatch(/name|phone|tel/i);
      expect(Object.values(e.params).join()).not.toMatch(/\+380|\d{9}/);
    }
  });
});
