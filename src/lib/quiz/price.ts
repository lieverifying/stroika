/**
 * Расчёт экрана результата квиза (ARCHITECTURE.md 4.4). Чистая функция: все числа приходят снаружи (PriceInput).
 * Любая незаменённая заглушка или некорректное число в формуле даёт 'no-prices': цену не показываем,
 * пользователь видит вариант Б. Результат никогда не содержит NaN, Infinity, 0, отрицательных цен и «{{».
 */
import type { Fact, WidthBand, facts } from '../../content/facts';
import { num } from '../facts';
import type { Facade, LengthBand, QuizAnswers, QuizResult, ResultReason } from './types';

export interface PriceInput {
  /** Флаг facts.flags.quizResultVariant */
  configured: 'A' | 'B';
  prices: {
    perMeter: Record<'mdfFilm' | 'mdfPainted' | 'dsp', Fact<number>>;
    countertopPerMeter: Record<'dsp' | 'quartz', Fact<number>>;
    islandSurcharge: Fact<number>;
    wardrobePerMeter: Record<'kupe' | 'rozpashna' | 'harderobna', Fact<number>>;
  };
  quiz: {
    kitchenLenMinM: Fact<number>;
    kitchenLenMaxM: Fact<number>;
    wardrobeWidthBands: Fact<WidthBand[]>;
    priceRound: Fact<number>;
    maxRangeRatio: Fact<number>;
    facadeTypesConfirmed: Fact<string[]>;
  };
}

export function factsToPriceInput(f: typeof facts): PriceInput {
  return {
    configured: f.flags.quizResultVariant,
    prices: {
      perMeter: f.prices.perMeter,
      countertopPerMeter: f.prices.countertopPerMeter,
      islandSurcharge: f.prices.islandSurcharge,
      wardrobePerMeter: f.prices.wardrobePerMeter,
    },
    quiz: {
      kitchenLenMinM: f.quiz.kitchenLenMinM,
      kitchenLenMaxM: f.quiz.kitchenLenMaxM,
      wardrobeWidthBands: f.quiz.wardrobeWidthBands,
      priceRound: f.quiz.priceRound,
      maxRangeRatio: f.quiz.maxRangeRatio,
      facadeTypesConfirmed: f.quiz.facadeTypesConfirmed,
    },
  };
}

/** Число > 0 или null (заглушка, NaN, Infinity, 0, отрицательное) */
function positive(v: Fact<number>): number | null {
  const n = num(v);
  return n !== null && n > 0 ? n : null;
}

/** Сумма в копейках без накопления ошибок float: 10500.000000001 → 10500 */
const clean = (x: number) => Math.round(x * 100) / 100;

type Range = { from: number; to: number };
type Outcome = { range: Range } | { reason: ResultReason };

const FACADE_KEY = { 'mdf-film': 'mdfFilm', 'mdf-painted': 'mdfPainted', dsp: 'dsp' } as const;
type FacadeType = keyof typeof FACADE_KEY;
const ALL_FACADES: FacadeType[] = ['mdf-film', 'mdf-painted', 'dsp'];

const LENGTH_RANGES: Record<Exclude<LengthBand, 'unknown'>, [number | 'min', number | 'max']> = {
  lt3: ['min', 3],
  '3to4': [3, 4],
  '4to5': [4, 5],
  gt5: [5, 'max'],
};

/** Округление границ и проверка ширины вилки; null-reason означает «вилка годится» */
function finalize(lo: number, hi: number, input: PriceInput): Outcome {
  const step = positive(input.quiz.priceRound);
  const ratio = positive(input.quiz.maxRangeRatio);
  if (step === null || ratio === null) return { reason: 'no-prices' };
  const from = Math.floor(clean(lo) / step) * step;
  const to = Math.ceil(clean(hi) / step) * step;
  if (![from, to].every((v) => Number.isFinite(v) && v > 0) || to < from) return { reason: 'no-prices' };
  if (to / from > ratio) return { reason: 'range-too-wide' };
  return { range: { from, to } };
}

function kitchenOutcome(a: QuizAnswers, input: PriceInput): Outcome {
  const band = a.kitchenLength;
  if (band === undefined || band === 'unknown') return { reason: 'no-length' };
  const [loSpec, hiSpec] = LENGTH_RANGES[band];
  const lMin = loSpec === 'min' ? positive(input.quiz.kitchenLenMinM) : loSpec;
  const lMax = hiSpec === 'max' ? positive(input.quiz.kitchenLenMaxM) : hiSpec;
  if (lMin === null || lMax === null) return { reason: 'no-prices' };

  // Фасад: цена за метр выбранного типа или min/max по подтверждённым типам
  const perMeter = input.prices.perMeter;
  const facade: Facade | undefined = a.facade;
  let types: FacadeType[];
  if (facade === 'advise') {
    const confirmed = input.quiz.facadeTypesConfirmed;
    types = Array.isArray(confirmed) ? ALL_FACADES.filter((t) => confirmed.includes(t)) : ALL_FACADES;
  } else if (facade !== undefined && facade in FACADE_KEY) {
    types = [facade as FacadeType];
  } else {
    return { reason: 'no-prices' };
  }
  const p = types.map((t) => positive(perMeter[FACADE_KEY[t]]));
  if (p.length === 0 || p.some((v) => v === null)) return { reason: 'no-prices' };
  const pVals = p as number[];

  // Столешница: dsp / quartz, а «Ще не вирішили» — вилка от ДСП до кварца
  const ct = input.prices.countertopPerMeter;
  const dsp = positive(ct.dsp);
  const quartz = positive(ct.quartz);
  let sMin: number | null;
  let sMax: number | null;
  if (a.countertop === 'dsp') sMin = sMax = dsp;
  else if (a.countertop === 'quartz') sMin = sMax = quartz;
  else if (a.countertop === 'undecided') {
    sMin = dsp;
    sMax = quartz;
  } else return { reason: 'no-prices' };
  if (sMin === null || sMax === null) return { reason: 'no-prices' };

  let island = 0;
  if (a.kitchenShape === 'ostriv') {
    const s = positive(input.prices.islandSurcharge);
    if (s === null) return { reason: 'no-prices' };
    island = s;
  }

  const lo = lMin * (Math.min(...pVals) + Math.min(sMin, sMax)) + island;
  const hi = lMax * (Math.max(...pVals) + Math.max(sMin, sMax)) + island;
  return finalize(lo, hi, input);
}

function wardrobeOutcome(a: QuizAnswers, input: PriceInput): Outcome {
  if (a.wardrobeWidth === undefined || a.wardrobeWidth === 'unknown') return { reason: 'no-length' };
  const bands = input.quiz.wardrobeWidthBands;
  if (!Array.isArray(bands)) return { reason: 'no-prices' };
  const band = bands.find((b) => b.id === a.wardrobeWidth);
  if (!band) return { reason: 'no-prices' };
  const wMin = positive(band.min);
  const wMax = positive(band.max);
  const rates = input.prices.wardrobePerMeter;
  const rate = a.wardrobeType !== undefined && a.wardrobeType in rates ? positive(rates[a.wardrobeType]) : null;
  if (wMin === null || wMax === null || rate === null) return { reason: 'no-prices' };
  return finalize(wMin * rate, wMax * rate, input);
}

export function computeResult(answers: QuizAnswers, input: PriceInput): QuizResult {
  const configured = input.configured;
  const fallback = (reason: ResultReason): QuizResult => ({ variant: 'B', configured, reason });

  if (configured === 'B') return fallback('variant-b');
  if (answers.goal !== 'kitchen' && answers.goal !== 'wardrobe') return fallback('short-branch');

  const outcome = answers.goal === 'kitchen' ? kitchenOutcome(answers, input) : wardrobeOutcome(answers, input);
  if ('reason' in outcome) return fallback(outcome.reason);
  return { variant: 'A', configured, reason: 'ok', price: { ...outcome.range, currency: 'UAH' } };
}
