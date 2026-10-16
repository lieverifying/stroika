// Юнит-тесты хранения состояния квиза в localStorage (ARCHITECTURE 4.5)
import { describe, expect, test } from 'vitest';
import { answer, start } from '../../src/lib/quiz/machine';
import { clearState, loadState, saveState, type StorageLike } from '../../src/lib/quiz/storage';
import type { QuizState } from '../../src/lib/quiz/types';

const KEY = 'vymir.quiz.v1';
const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000;

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('denied');
  },
};

function sampleState(): QuizState {
  let s = start(T0);
  s = answer(s, 'kitchen', T0 + 1);
  s = answer(s, 'kutova', T0 + 2);
  return { ...s, started: true, firedSteps: [1, 2] };
}

describe('saveState / loadState', () => {
  test('roundtrip возвращает равное состояние', () => {
    const st = memoryStorage();
    const s = sampleState();
    saveState(s, st);
    expect(st.data.has(KEY)).toBe(true);
    expect(loadState(T0 + 1000, st)).toEqual(s);
  });

  test('пустое хранилище — null', () => {
    expect(loadState(T0, memoryStorage())).toBeNull();
  });

  test('ровно 7 суток — ещё живо, больше — истекло и удалено', () => {
    const st = memoryStorage();
    const s = sampleState();
    saveState(s, st);
    expect(loadState(s.updatedAt + 7 * DAY, st)).toEqual(s);
    expect(loadState(s.updatedAt + 7 * DAY + 1, st)).toBeNull();
    expect(st.data.has(KEY)).toBe(false);
  });

  test('другая версия — null и ключ удалён', () => {
    const st = memoryStorage();
    st.setItem(KEY, JSON.stringify({ ...sampleState(), version: 2 }));
    expect(loadState(T0 + 10, st)).toBeNull();
    expect(st.data.has(KEY)).toBe(false);
  });

  test('битый JSON — null и ключ удалён', () => {
    const st = memoryStorage();
    st.setItem(KEY, '{not json');
    expect(loadState(T0, st)).toBeNull();
    expect(st.data.has(KEY)).toBe(false);
  });

  test('JSON не-объект или без обязательных полей — null и ключ удалён', () => {
    for (const raw of ['null', '42', '"x"', '[]', '{"version":1}']) {
      const st = memoryStorage();
      st.setItem(KEY, raw);
      expect(loadState(T0, st), raw).toBeNull();
      expect(st.data.has(KEY), raw).toBe(false);
    }
  });

  test('clearState удаляет ключ', () => {
    const st = memoryStorage();
    saveState(sampleState(), st);
    clearState(st);
    expect(st.data.has(KEY)).toBe(false);
  });
});

describe('контактные данные не сохраняются', () => {
  test('лишние поля состояния и ответов отбрасываются', () => {
    const st = memoryStorage();
    const dirty = {
      ...sampleState(),
      name: 'Олена',
      phone: '+380671234567',
      contact: { name: 'Олена', phone: '+380671234567', method: 'call', consent: true },
      answers: {
        goal: 'kitchen',
        kitchenShape: 'kutova',
        task: 'Тумба',
        name: 'Олена',
        phone: '+380671234567',
        method: 'viber',
        consent: true,
      },
    } as unknown as QuizState;
    saveState(dirty, st);
    const raw = st.data.get(KEY) ?? '';
    for (const bad of ['name', 'phone', 'method', 'consent', 'contact', 'Олена', '380671234567']) {
      expect(raw, bad).not.toContain(bad);
    }
    const loaded = loadState(T0 + 5, st);
    expect(loaded?.answers).toEqual({ goal: 'kitchen', kitchenShape: 'kutova', task: 'Тумба' });
  });

  test('при загрузке лишние поля из хранилища тоже отбрасываются', () => {
    const st = memoryStorage();
    st.setItem(KEY, JSON.stringify({ ...sampleState(), phone: '+380671234567', answers: { goal: 'kitchen', phone: '1' } }));
    const loaded = loadState(T0 + 5, st);
    expect(loaded).not.toBeNull();
    expect(JSON.stringify(loaded)).not.toContain('phone');
  });
});

describe('недоступное хранилище', () => {
  test('функции не бросают, load возвращает null', () => {
    expect(() => saveState(sampleState(), throwing)).not.toThrow();
    expect(loadState(T0, throwing)).toBeNull();
    expect(() => clearState(throwing)).not.toThrow();
  });

  test('геттер localStorage бросает (приватный режим)', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('SecurityError');
      },
    });
    try {
      expect(() => saveState(sampleState())).not.toThrow();
      expect(loadState(T0)).toBeNull();
      expect(() => clearState()).not.toThrow();
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else delete (globalThis as Record<string, unknown>).localStorage;
    }
  });

  test('localStorage отсутствует (node) — не бросает', () => {
    expect(loadState(T0)).toBeNull();
  });
});
