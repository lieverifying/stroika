/**
 * Типы квиза (ARCHITECTURE.md 4.3, ТЗ v2 2026-10-21). Ветки: кухня (6 шагов), шафа (5), інші меблі (4).
 * Имя и телефон живут только в QuizContact и никогда не попадают в QuizState / localStorage.
 */
import type { Fact } from '../../content/facts';

/** 'custom' («Інше, нестандартне») — не ветка квиза: ведёт в блок «Нестандартне завдання» (#zapyt) */
export type Goal = 'kitchen' | 'wardrobe' | 'other' | 'custom';
export type Branch = 'kitchen' | 'wardrobe' | 'other';
export type StepId =
  | 'goal'
  | 'kitchenShape'
  | 'kitchenLength'
  | 'facade'
  | 'wardrobeType'
  | 'wardrobeWidth'
  | 'otherType'
  | 'timing'
  | 'contact';

export type KitchenShape = 'pryama' | 'kutova' | 'p-podibna' | 'ostriv';
export type LengthBand = 'lt3' | '3to4' | '4to5' | 'gt5' | 'unknown';
export type Facade = 'mdf-film' | 'mdf-painted' | 'dsp' | 'acryl' | 'hpl' | 'advise';
export type Countertop = 'dsp' | 'quartz' | 'undecided';
export type WardrobeType = 'kupe' | 'rozpashna' | 'harderobna';
/** id диапазона ширины из facts.quiz.wardrobeWidthBands или 'unknown' */
export type WidthBand = string;
export type OtherType = 'peredpokii' | 'dytiacha' | 'tumba' | 'tv-zona' | 'biznes' | 'inshe';
export type Timing = 'within3m' | '3to6m' | 'later' | 'unknown';
export type ContactMethod = 'call' | 'viber' | 'telegram';

export interface QuizAnswers {
  goal?: Goal;
  kitchenShape?: KitchenShape;
  kitchenLength?: LengthBand;
  facade?: Facade;
  /** Шага «Стільниця» в квизе нет (ТЗ v2); поле осталось для расчёта экрана А — без ответа считаем «Ще не вирішили» */
  countertop?: Countertop;
  wardrobeType?: WardrobeType;
  wardrobeWidth?: WidthBand;
  otherType?: OtherType;
  timing?: Timing;
}

/** НЕ пишется в localStorage */
export interface QuizContact {
  name: string;
  phone: string;
  method: ContactMethod;
  consent: true;
  /** «Хто вас порекомендував?» — необязательно */
  referrer?: string;
}

export interface OptionDef {
  value: string;
  /** Подпись; пока факт не подтверждён — заглушка {{…}}, видна плашкой */
  label: Fact<string>;
  /** Схема-картинка (inline SVG по имени): форма кухни или тип шафы */
  icon?: KitchenShape | WardrobeType;
  /** Вариант не выбирается в квизе, а ведёт по ссылке (например, «Інше, нестандартне» → #zapyt) */
  href?: string;
}

export interface StepDef {
  id: StepId;
  tzNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Вопрос на украинском */
  title: string;
  kind: 'single' | 'contact';
  options?: OptionDef[];
  next(a: QuizAnswers): StepId | 'submit';
}

export interface QuizState {
  version: 1;
  stepId: StepId;
  /** стек для «Назад» */
  history: StepId[];
  answers: QuizAnswers;
  /** quiz_start уже отправлен */
  started: boolean;
  /** какие quiz_step_N уже отправлены */
  firedSteps: number[];
  startedAt: number;
  /** от него считается TTL хранения */
  updatedAt: number;
}

export type ResultReason = 'ok' | 'variant-b' | 'no-length' | 'no-prices' | 'range-too-wide' | 'short-branch';

export interface QuizResult {
  /** что реально показано */
  variant: 'A' | 'B';
  /** что стоит во флаге */
  configured: 'A' | 'B';
  reason: ResultReason;
  price?: { from: number; to: number; currency: 'UAH' };
}
