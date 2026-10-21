// Юнит-тесты расчёта результата квиза (ARCHITECTURE 4.4).
// Все числа — тестовые данные, объявленные здесь; в facts.ts они не попадают.
import { describe, expect, test } from 'vitest';
import { facts } from '../../src/content/facts';
import { computeResult, factsToPriceInput, type PriceInput } from '../../src/lib/quiz/price';
import type { QuizAnswers } from '../../src/lib/quiz/types';

const PH = '{{TEST_PLACEHOLDER}}' as const;

const BANDS = [
  { id: 'w1', label: 'до 2 м', min: 1.5, max: 2.5 },
  { id: 'w2', label: '2–3 м', min: 2.5, max: 3.5 },
];

function input(over: Partial<{ [K in keyof PriceInput]: Partial<PriceInput[K]> }> & { configured?: 'A' | 'B' } = {}): PriceInput {
  return {
    configured: over.configured ?? 'A',
    prices: {
      perMeter: { mdfFilm: 10000, mdfPainted: 14000, dsp: 8000, ...over.prices?.perMeter },
      countertopPerMeter: { dsp: 2000, quartz: 5000, ...over.prices?.countertopPerMeter },
      islandSurcharge: over.prices?.islandSurcharge ?? 20000,
      wardrobePerMeter: { kupe: 7000, rozpashna: 9000, harderobna: 11000, ...over.prices?.wardrobePerMeter },
    },
    quiz: {
      kitchenLenMinM: 2,
      kitchenLenMaxM: 6,
      wardrobeWidthBands: BANDS,
      priceRound: 1000,
      maxRangeRatio: 3,
      facadeTypesConfirmed: PH,
      ...over.quiz,
    },
  } as PriceInput;
}

const kitchen = (over: QuizAnswers = {}): QuizAnswers => ({
  goal: 'kitchen',
  kitchenShape: 'kutova',
  kitchenLength: '3to4',
  facade: 'mdf-film',
  countertop: 'quartz',
  timing: '3to6m',
  ...over,
});
const wardrobe = (over: QuizAnswers = {}): QuizAnswers => ({
  goal: 'wardrobe',
  wardrobeType: 'kupe',
  wardrobeWidth: 'w1',
  timing: 'later',
  ...over,
});

describe('computeResult: причины отката', () => {
  test('configured B — всегда variant-b', () => {
    expect(computeResult(kitchen(), input({ configured: 'B' }))).toEqual({
      variant: 'B',
      configured: 'B',
      reason: 'variant-b',
    });
  });
  test.each(['other', 'custom'] as const)('ветка без цены %s', (goal) => {
    const r = computeResult({ goal, otherType: 'tumba' }, input());
    expect(r).toEqual({ variant: 'B', configured: 'A', reason: 'short-branch' });
  });
  test('длина кухни unknown — no-length', () => {
    expect(computeResult(kitchen({ kitchenLength: 'unknown' }), input()).reason).toBe('no-length');
  });
  test('ширина шафы unknown — no-length', () => {
    expect(computeResult(wardrobe({ wardrobeWidth: 'unknown' }), input()).reason).toBe('no-length');
  });
  test('нет ответа о длине — no-length', () => {
    expect(computeResult(kitchen({ kitchenLength: undefined }), input()).reason).toBe('no-length');
  });
  test('нет цели — short-branch безопасно не падает', () => {
    expect(computeResult({}, input()).variant).toBe('B');
  });
});

describe('computeResult: кухня', () => {
  test('конкретные фасад и столешница', () => {
    const r = computeResult(kitchen(), input());
    expect(r).toEqual({
      variant: 'A',
      configured: 'A',
      reason: 'ok',
      price: { from: 45000, to: 60000, currency: 'UAH' },
    });
  });
  test.each([
    ['lt3', 2, 3],
    ['3to4', 3, 4],
    ['4to5', 4, 5],
    ['gt5', 5, 6],
  ] as const)('диапазон длины %s', (band, lo, hi) => {
    const r = computeResult(kitchen({ kitchenLength: band }), input());
    expect(r.price).toEqual({ from: lo * 15000, to: hi * 15000, currency: 'UAH' });
  });
  test('округление: вниз для X, вверх для Y', () => {
    const r = computeResult(kitchen(), input({ prices: { perMeter: { mdfFilm: 10300 } } } as never));
    expect(r.price).toMatchObject({ from: 45000, to: 62000 });
    const r2 = computeResult(kitchen(), input({ prices: { perMeter: { mdfFilm: 10300 } }, quiz: { priceRound: 5000 } } as never));
    expect(r2.price).toMatchObject({ from: 45000, to: 65000 });
  });
  test('остров добавляет надбавку к обеим границам', () => {
    const r = computeResult(kitchen({ kitchenShape: 'ostriv' }), input());
    expect(r.price).toMatchObject({ from: 65000, to: 80000 });
  });
  test('остров без надбавки — no-prices', () => {
    const r = computeResult(kitchen({ kitchenShape: 'ostriv' }), input({ prices: { islandSurcharge: PH } } as never));
    expect(r.reason).toBe('no-prices');
  });
  test('без острова заглушка надбавки не мешает', () => {
    const r = computeResult(kitchen(), input({ prices: { islandSurcharge: PH } } as never));
    expect(r.reason).toBe('ok');
  });
  test('столешница undecided: от ДСП до кварца', () => {
    const r = computeResult(kitchen({ countertop: 'undecided' }), input());
    expect(r.price).toMatchObject({ from: 3 * 12000, to: 4 * 15000 });
  });
  test('фасад advise при заглушке списка — по всем трём типам', () => {
    const r = computeResult(kitchen({ facade: 'advise', countertop: 'dsp' }), input());
    // min: 8000+2000, max: 14000+2000
    expect(r.price).toMatchObject({ from: 3 * 10000, to: 4 * 16000 });
  });
  test('фасад advise: только подтверждённые типы', () => {
    const r = computeResult(
      kitchen({ facade: 'advise', countertop: 'dsp' }),
      input({ quiz: { facadeTypesConfirmed: ['mdf-film', 'mdf-painted'] } } as never),
    );
    expect(r.price).toMatchObject({ from: 3 * 12000, to: 4 * 16000 });
  });
  test('фасад advise: подтверждённый список без известных типов — no-prices', () => {
    const r = computeResult(kitchen({ facade: 'advise' }), input({ quiz: { facadeTypesConfirmed: ['x'] } } as never));
    expect(r.reason).toBe('no-prices');
  });
  test('слишком широкий диапазон — range-too-wide', () => {
    const r = computeResult(
      kitchen({ facade: 'advise', countertop: 'undecided' }),
      input({ quiz: { maxRangeRatio: 2 } } as never),
    );
    expect(r).toEqual({ variant: 'B', configured: 'A', reason: 'range-too-wide' });
  });
  test('отношение ровно на границе допустимо', () => {
    // 3to4, одна цена: Y/X = 4/3
    const r = computeResult(kitchen({ kitchenLength: '3to4' }), input({ quiz: { maxRangeRatio: 60000 / 45000 } } as never));
    expect(r.reason).toBe('ok');
  });
  test.each([
    ['perMeter.mdfFilm', { prices: { perMeter: { mdfFilm: PH } } }],
    ['countertop quartz', { prices: { countertopPerMeter: { quartz: PH } } }],
    ['kitchenLenMaxM (gt5)', { quiz: { kitchenLenMaxM: PH } }],
    ['priceRound', { quiz: { priceRound: PH } }],
    ['maxRangeRatio', { quiz: { maxRangeRatio: PH } }],
  ])('заглушка %s — no-prices', (_n, over) => {
    const a = kitchen({ kitchenLength: _n.startsWith('kitchenLenMax') ? 'gt5' : '3to4' });
    expect(computeResult(a, input(over as never)).reason).toBe('no-prices');
  });
  test('kitchenLenMinM — заглушка даёт no-prices только для lt3', () => {
    const over = { quiz: { kitchenLenMinM: PH } } as never;
    expect(computeResult(kitchen({ kitchenLength: 'lt3' }), input(over)).reason).toBe('no-prices');
    expect(computeResult(kitchen({ kitchenLength: '3to4' }), input(over)).reason).toBe('ok');
  });
  test.each([0, -5, NaN, Infinity])('некорректная цена %s — no-prices', (bad) => {
    expect(computeResult(kitchen(), input({ prices: { perMeter: { mdfFilm: bad } } } as never)).reason).toBe('no-prices');
  });
  test('нулевое округление — no-prices', () => {
    expect(computeResult(kitchen(), input({ quiz: { priceRound: 0 } } as never)).reason).toBe('no-prices');
  });
  test('нет ответа о фасаде — no-prices', () => {
    expect(computeResult(kitchen({ facade: undefined }), input()).reason).toBe('no-prices');
  });
});

describe('computeResult: шафа', () => {
  test('ширина × ставка с округлением', () => {
    const r = computeResult(wardrobe(), input());
    // 1.5*7000=10500 → 10000; 2.5*7000=17500 → 18000
    expect(r.price).toEqual({ from: 10000, to: 18000, currency: 'UAH' });
    expect(r.reason).toBe('ok');
  });
  test.each([
    ['rozpashna', 2.5 * 9000, 3.5 * 9000, 22000, 32000],
    ['harderobna', 2.5 * 11000, 3.5 * 11000, 27000, 39000],
  ] as const)('тип %s', (type, _lo, _hi, from, to) => {
    const r = computeResult(wardrobe({ wardrobeType: type, wardrobeWidth: 'w2' }), input());
    expect(r.price).toMatchObject({ from, to });
  });
  test('ставка гардеробной — заглушка: no-prices', () => {
    const r = computeResult(wardrobe({ wardrobeType: 'harderobna' }), input({ prices: { wardrobePerMeter: { harderobna: PH } } } as never));
    expect(r.reason).toBe('no-prices');
  });
  test('диапазоны — заглушка: no-prices', () => {
    expect(computeResult(wardrobe(), input({ quiz: { wardrobeWidthBands: PH } } as never)).reason).toBe('no-prices');
  });
  test('неизвестный id диапазона: no-prices', () => {
    expect(computeResult(wardrobe({ wardrobeWidth: 'nope' }), input()).reason).toBe('no-prices');
  });
  test('диапазон шире допустимого — range-too-wide', () => {
    expect(computeResult(wardrobe(), input({ quiz: { maxRangeRatio: 1.1 } } as never)).reason).toBe('range-too-wide');
  });
  test('нет типа шафы — no-prices', () => {
    expect(computeResult(wardrobe({ wardrobeType: undefined }), input()).reason).toBe('no-prices');
  });
});

describe('computeResult: охранные свойства', () => {
  const GOALS = ['kitchen', 'wardrobe', 'other', 'custom', undefined] as const;
  const SHAPES = ['pryama', 'kutova', 'p-podibna', 'ostriv', undefined] as const;
  const LENS = ['lt3', '3to4', '4to5', 'gt5', 'unknown', undefined] as const;
  const FACADES = ['mdf-film', 'mdf-painted', 'dsp', 'advise', undefined] as const;
  const TOPS = ['dsp', 'quartz', 'undecided', undefined] as const;
  const WTYPES = ['kupe', 'rozpashna', 'harderobna', undefined] as const;
  const WIDTHS = ['w1', 'w2', 'unknown', 'bogus', undefined] as const;

  function* allAnswers(): Generator<QuizAnswers> {
    for (const goal of GOALS)
      for (const kitchenShape of SHAPES)
        for (const kitchenLength of LENS)
          for (const facade of FACADES)
            for (const countertop of TOPS)
              yield { goal, kitchenShape, kitchenLength, facade, countertop };
    for (const wardrobeType of WTYPES)
      for (const wardrobeWidth of WIDTHS) yield { goal: 'wardrobe', wardrobeType, wardrobeWidth };
  }

  const inputs: PriceInput[] = [
    input(),
    input({ configured: 'B' }),
    input({ prices: { perMeter: { mdfFilm: PH, dsp: -1 }, islandSurcharge: PH } } as never),
    input({ quiz: { priceRound: 0, kitchenLenMinM: 0, maxRangeRatio: NaN } } as never),
    input({ quiz: { wardrobeWidthBands: PH, facadeTypesConfirmed: ['dsp'] } } as never),
    input({ prices: { countertopPerMeter: { dsp: Infinity }, wardrobePerMeter: { kupe: 0 } } } as never),
  ];

  test('результат не содержит NaN, Infinity, 0, отрицательных цен и «{{»', () => {
    let count = 0;
    for (const inp of inputs) {
      for (const a of allAnswers()) {
        const r = computeResult(a, inp);
        count++;
        const json = JSON.stringify(r);
        expect(json).not.toContain('{{');
        expect(json).not.toMatch(/NaN|Infinity|null/);
        if (r.variant === 'A') {
          expect(r.reason).toBe('ok');
          expect(r.price!.from).toBeGreaterThan(0);
          expect(r.price!.to).toBeGreaterThanOrEqual(r.price!.from);
          expect(Number.isFinite(r.price!.to)).toBe(true);
        } else {
          expect(r.price).toBeUndefined();
          expect(r.reason).not.toBe('ok');
        }
      }
    }
    expect(count).toBeGreaterThan(10000);
  });
});

describe('computeResult с реальными facts.ts', () => {
  test('factsToPriceInput берёт флаг варианта и значения из facts', () => {
    const i = factsToPriceInput(facts);
    expect(i.configured).toBe(facts.flags.quizResultVariant);
    expect(i.prices.perMeter.dsp).toBe(facts.prices.perMeter.dsp);
    expect(i.quiz.priceRound).toBe(facts.quiz.priceRound);
  });
  test('пока цен нет, ни одна комбинация не даёт ok и всегда вариант Б', () => {
    const real = factsToPriceInput(facts);
    // флаг Б по умолчанию, поэтому проверяем и с принудительным A: тогда причина no-prices / no-length / short-branch
    for (const inp of [real, { ...real, configured: 'A' as const }]) {
      for (const goal of ['kitchen', 'wardrobe', 'other', 'custom'] as const) {
        for (const len of ['lt3', '3to4', '4to5', 'gt5', 'unknown'] as const) {
          for (const facade of ['mdf-film', 'mdf-painted', 'dsp', 'advise'] as const) {
            for (const shape of ['pryama', 'ostriv'] as const) {
              const r = computeResult(
                { goal, kitchenShape: shape, kitchenLength: len, facade, countertop: 'undecided',
                  wardrobeType: 'kupe', wardrobeWidth: len === 'unknown' ? 'unknown' : 'band-1' },
                inp,
              );
              expect(r.reason).not.toBe('ok');
              expect(r.variant).toBe('B');
              expect(['variant-b', 'short-branch', 'no-length', 'no-prices']).toContain(r.reason);
            }
          }
        }
      }
    }
  });
  test('при configured A с реальными facts кухня с длиной — no-prices', () => {
    const r = computeResult(kitchen(), { ...factsToPriceInput(facts), configured: 'A' });
    expect(r.reason).toBe('no-prices');
  });
});
