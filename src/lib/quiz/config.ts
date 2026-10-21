/**
 * Шаги, варианты и граф переходов квиза (ARCHITECTURE.md 4.1–4.2, ТЗ «Квиз-калькулятор»).
 * В конфиге нет ни цифр ширины, ни цен, ни сроков: всё, что зависит от владельца, — из facts.ts.
 * Пути (ТЗ v2, 2026-10-21): кухня goal → kitchenShape → kitchenLength → facade → timing → contact (6);
 *       шафа goal → wardrobeType → wardrobeWidth → timing → contact (5); інші меблі goal → otherType → timing → contact (4).
 * «Інше, нестандартне» — не ветка: вариант со ссылкой на блок «Нестандартне завдання» (/kontakty#zapyt).
 */
import { facts, type Fact, type WidthBand as WidthBandFact } from '../../content/facts';
import { isPlaceholder } from '../facts';
import type { Branch, Goal, OptionDef, QuizAnswers, StepDef, StepId } from './types';

/** Ветка по ответу на шаг 1; до выбора — null */
export function branchOf(goal: Goal | undefined): Branch | null {
  if (goal === 'kitchen') return 'kitchen';
  if (goal === 'wardrobe') return 'wardrobe';
  if (goal === 'other') return 'other';
  return null;
}

/** Диапазоны ширины шкафа от владельца есть — шаг «Приблизна ширина» показываем; нет — пропускаем (нет факта — нет шага) */
export const HAS_WARDROBE_WIDTH = !isPlaceholder(facts.quiz.wardrobeWidthBands);

export const PATHS: Record<Branch, StepId[]> = {
  kitchen: ['goal', 'kitchenShape', 'kitchenLength', 'facade', 'timing', 'contact'],
  wardrobe: HAS_WARDROBE_WIDTH
    ? ['goal', 'wardrobeType', 'wardrobeWidth', 'timing', 'contact']
    : ['goal', 'wardrobeType', 'timing', 'contact'],
  other: ['goal', 'otherType', 'timing', 'contact'],
};

/** Поля ответов каждой ветки (смена ветки на шаге 1 удаляет чужие) */
export const BRANCH_FIELDS: Record<Branch, (keyof QuizAnswers)[]> = {
  kitchen: ['kitchenShape', 'kitchenLength', 'facade', 'timing'],
  wardrobe: ['wardrobeType', 'wardrobeWidth', 'timing'],
  other: ['otherType', 'timing'],
};

// Фасады — список владельца (ТЗ v2, 2026-10-21). «Порадьте» есть всегда.
const FACADES: OptionDef[] = [
  { value: 'mdf-film', label: 'МДФ у плівці' },
  { value: 'mdf-painted', label: 'Фарбований МДФ' },
  { value: 'dsp', label: 'ДСП' },
  { value: 'acryl', label: 'Акрил' },
  { value: 'hpl', label: 'HPL' },
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
  return [...list, { value: 'unknown', label: 'Не знаю' }];
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
      { value: 'custom', label: 'Інше, нестандартне', href: '/kontakty#zapyt' },
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
      { value: 'unknown', label: 'Не знаю — заміряємо' },
    ],
    next: () => 'facade',
  },
  facade: {
    id: 'facade',
    tzNumber: 4,
    title: 'Фасади',
    kind: 'single',
    options: [...filterConfirmed(FACADES, facts.quiz.facadeTypesConfirmed), { value: 'advise', label: 'Порадьте' }],
    next: toTiming,
  },
  wardrobeType: {
    id: 'wardrobeType',
    tzNumber: 2,
    title: 'Що саме потрібно?',
    kind: 'single',
    options: [
      { value: 'kupe', label: 'Купе' },
      { value: 'rozpashna', label: 'Розпашна' },
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
  otherType: {
    id: 'otherType',
    tzNumber: 2,
    title: 'Що саме потрібно?',
    kind: 'single',
    options: [
      { value: 'peredpokii', label: 'Передпокій' },
      { value: 'dytiacha', label: 'Дитяча' },
      { value: 'tumba', label: 'Тумба у ванну' },
      { value: 'tv-zona', label: 'ТВ-зона' },
      { value: 'biznes', label: 'Меблі для бізнесу' },
      { value: 'inshe', label: 'Інше' },
    ],
    next: toTiming,
  },
  timing: {
    id: 'timing',
    tzNumber: 6,
    title: 'Коли плануєте встановлення?',
    kind: 'single',
    options: [
      { value: 'within3m', label: 'Протягом 3 місяців' },
      { value: '3to6m', label: 'Через 3–6 місяців' },
      { value: 'later', label: 'Пізніше' },
      { value: 'unknown', label: 'Ще не знаю' },
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
};
