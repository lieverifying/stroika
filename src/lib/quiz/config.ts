/**
 * Шаги, варианты и граф переходов квиза (ARCHITECTURE.md 4.1–4.2, ТЗ «Квиз-калькулятор»).
 * В конфиге нет ни цифр ширины, ни цен, ни сроков: всё, что зависит от владельца, — из facts.ts.
 * Пути: кухня goal → kitchenShape → kitchenLength → facade → countertop → timing → contact (7);
 *       шафа goal → wardrobeType → [wardrobeWidth, если есть диапазоны] → timing → contact (5 или 4); інші меблі goal → shortForm (2).
 * «Інше, нестандартне» — не ветка: вариант со ссылкой на блок «Нестандартне завдання» (#zapyt).
 */
import { facts, type Fact, type WidthBand as WidthBandFact } from '../../content/facts';
import { isPlaceholder } from '../facts';
import type { Branch, Goal, OptionDef, QuizAnswers, StepDef, StepId } from './types';

/** Ветка по ответу на шаг 1; до выбора — null */
export function branchOf(goal: Goal | undefined): Branch | null {
  if (goal === 'kitchen') return 'kitchen';
  if (goal === 'wardrobe') return 'wardrobe';
  if (goal === 'other') return 'short';
  return null;
}

/** Диапазоны ширины шкафа от владельца есть — шаг «Приблизна ширина» показываем; нет — пропускаем (нет факта — нет шага) */
export const HAS_WARDROBE_WIDTH = !isPlaceholder(facts.quiz.wardrobeWidthBands);

export const PATHS: Record<Branch, StepId[]> = {
  kitchen: ['goal', 'kitchenShape', 'kitchenLength', 'facade', 'countertop', 'timing', 'contact'],
  wardrobe: HAS_WARDROBE_WIDTH
    ? ['goal', 'wardrobeType', 'wardrobeWidth', 'timing', 'contact']
    : ['goal', 'wardrobeType', 'timing', 'contact'],
  short: ['goal', 'shortForm'],
};

/** Поля ответов каждой ветки (смена ветки на шаге 1 удаляет чужие) */
export const BRANCH_FIELDS: Record<Branch, (keyof QuizAnswers)[]> = {
  kitchen: ['kitchenShape', 'kitchenLength', 'facade', 'countertop', 'timing'],
  wardrobe: ['wardrobeType', 'wardrobeWidth', 'timing'],
  short: ['task'],
};

// Фасады: дерево убрано до подтверждения материалов. «Порадьте» есть всегда.
const FACADES: OptionDef[] = [
  { value: 'mdf-film', label: 'МДФ у плівці' },
  { value: 'mdf-painted', label: 'Фарбований МДФ' },
  { value: 'dsp', label: 'ДСП' },
];
const COUNTERTOPS: OptionDef[] = [
  { value: 'dsp', label: 'ДСП' },
  { value: 'quartz', label: 'Кварц або акрил' },
];

/**
 * Оставить только подтверждённые владельцем варианты. Пока список — заглушка, показываем все из ТЗ.
 * В facts список хранит value вариантов: ['mdf-film', 'dsp'].
 */
export function filterConfirmed(options: OptionDef[], confirmed: Fact<string[]>): OptionDef[] {
  return isPlaceholder(confirmed) ? options : options.filter((o) => confirmed.includes(o.value));
}

/** Ширина шкафа: диапазоны из facts; пока заглушка — 3 места с видимой заглушкой вместо подписи */
export function wardrobeWidthOptions(bands: Fact<WidthBandFact[]>): OptionDef[] {
  const list: OptionDef[] = isPlaceholder(bands)
    ? [1, 2, 3].map((n) => ({ value: `band-${n}`, label: bands }))
    : bands.map((b) => ({ value: b.id, label: b.label }));
  return [...list, { value: 'unknown', label: 'Не знаю — приїдемо заміряти' }];
}

const toTiming: StepDef['next'] = () => 'timing';

export const STEPS: Record<StepId, StepDef> = {
  goal: {
    id: 'goal',
    tzNumber: 1,
    title: 'Що плануєте?',
    kind: 'single',
    options: [
      { value: 'kitchen', label: 'Кухня' },
      { value: 'wardrobe', label: 'Шафа або гардеробна' },
      { value: 'other', label: 'Інші меблі' },
      { value: 'custom', label: 'Інше, нестандартне', href: '#zapyt' },
    ],
    next: (a) => {
      const branch = branchOf(a.goal);
      return branch ? PATHS[branch][1] : 'goal';
    },
  },
  kitchenShape: {
    id: 'kitchenShape',
    tzNumber: 2,
    title: 'Яка форма кухні?',
    kind: 'single',
    options: [
      { value: 'pryama', label: 'Пряма', icon: 'pryama' },
      { value: 'kutova', label: 'Кутова', icon: 'kutova' },
      { value: 'p-podibna', label: 'П-подібна', icon: 'p-podibna' },
      { value: 'ostriv', label: 'З островом', icon: 'ostriv' },
    ],
    next: () => 'kitchenLength',
  },
  kitchenLength: {
    id: 'kitchenLength',
    tzNumber: 3,
    title: 'Приблизна довжина',
    kind: 'single',
    options: [
      { value: 'lt3', label: 'До 3 м' },
      { value: '3to4', label: '3–4 м' },
      { value: '4to5', label: '4–5 м' },
      { value: 'gt5', label: 'Більше 5 м' },
      { value: 'unknown', label: 'Не знаю — приїдемо заміряти' },
    ],
    next: () => 'facade',
  },
  facade: {
    id: 'facade',
    tzNumber: 4,
    title: 'Фасади',
    kind: 'single',
    options: [...filterConfirmed(FACADES, facts.quiz.facadeTypesConfirmed), { value: 'advise', label: 'Порадьте' }],
    next: () => 'countertop',
  },
  countertop: {
    id: 'countertop',
    tzNumber: 5,
    title: 'Стільниця',
    kind: 'single',
    options: [
      ...filterConfirmed(COUNTERTOPS, facts.quiz.countertopTypesConfirmed),
      { value: 'undecided', label: 'Ще не вирішили' },
    ],
    next: toTiming,
  },
  wardrobeType: {
    id: 'wardrobeType',
    tzNumber: 2,
    title: 'Що саме потрібно?',
    kind: 'single',
    options: [
      { value: 'kupe', label: 'Шафа-купе' },
      { value: 'rozpashna', label: 'Розпашна шафа' },
      { value: 'harderobna', label: 'Гардеробна' },
    ],
    next: () => (HAS_WARDROBE_WIDTH ? 'wardrobeWidth' : 'timing'),
  },
  wardrobeWidth: {
    id: 'wardrobeWidth',
    tzNumber: 3,
    title: 'Приблизна ширина',
    kind: 'single',
    options: wardrobeWidthOptions(facts.quiz.wardrobeWidthBands),
    next: toTiming,
  },
  timing: {
    id: 'timing',
    tzNumber: 6,
    title: 'Коли плануєте встановлення?',
    kind: 'single',
    options: [
      { value: 'within3m', label: 'Протягом 3 місяців' },
      { value: '1to3m', label: 'Через 1–3 місяці' },
      { value: 'later', label: 'Пізніше' },
    ],
    next: () => 'contact',
  },
  contact: {
    id: 'contact',
    tzNumber: 7,
    title: 'Куди надіслати розрахунок?',
    kind: 'contact',
    next: () => 'submit',
  },
  shortForm: {
    id: 'shortForm',
    tzNumber: 7,
    title: 'Опишіть задачу',
    kind: 'short-form',
    next: () => 'submit',
  },
};
