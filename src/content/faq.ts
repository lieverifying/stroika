/**
 * Вопросы и ответы (блок 12) — свой набор у каждой посадочной: FAQ_KUKHNI и FAQ_MEBLI (2026-10-21).
 * Сроки и цена — без цифр (считаем под задачу). Материалы, гарантия, оплата, рекомендации — только когда есть факты.
 * Ответы собираются только из facts.ts: факт — отдельная часть ответа, пока заглушка — видна плашкой.
 * Текст между фактами — шаблон без цифр и обещаний.
 */
import { facts, type Brand, type Fact } from './facts';
import { has, isPlaceholder, pluralUk } from '../lib/facts';

/** Часть ответа: обычный текст или факт (с форматом для настоящего значения) */
export type AnswerPart = string | { fact: Fact<string | number>; format?: (v: never) => string };

export interface FaqItem {
  q: string;
  a: AnswerPart[];
}

/** Список брендов → строка названий; заглушку оставляем заглушкой */
const brandNames = (brands: Fact<Brand[]>): Fact<string> =>
  isPlaceholder(brands) ? brands : brands.map((b) => b.name).join(', ');

const { warranty, payment, serviceArea, materials, services, referral } = facts;

// Нет факта — нет вопроса (режим запуска, 2026-10-21). Общие вопросы — для обеих посадочных.
const conditional: FaqItem[] = [
  ...(has(materials.materialBrands) && has(materials.hardwareBrands)
    ? [
        {
          q: 'З яких матеріалів і з якою фурнітурою робите?',
          a: ['Матеріали: ', { fact: brandNames(materials.materialBrands) }, '. Фурнітура: ', { fact: brandNames(materials.hardwareBrands) }, '.'],
        },
      ]
    : []),
  ...(facts.flags.warrantyPayment
    ? [
        {
          q: 'Яка гарантія?',
          a: ['Гарантія — ', { fact: warranty.years }, ` ${pluralUk(warranty.years, ['рік', 'роки', 'років'])}. `, { fact: warranty.terms }],
        },
        {
          q: 'Як відбувається оплата?',
          a: ['Передоплата — ', { fact: payment.prepayPercent }, ' %. ', { fact: payment.schedule }],
        },
      ]
    : []),
  ...(facts.flags.referralEnabled
    ? [
        {
          q: 'Чи є бонус, якщо порекомендувати вас друзям?',
          a: ['Так. Вам — ', { fact: referral.reward }, ', другові — ', { fact: referral.friendBonus }, '.'],
        },
      ]
    : []),
];
const areaTerms: AnswerPart[] = has(serviceArea.terms) ? [' ', { fact: serviceArea.terms }] : [];

/** Посадочная /kukhni (решение владельца, 2026-10-21): формулировки не повторяют /mebli */
export const FAQ_KUKHNI: FaqItem[] = [
  { q: 'Скільки коштує кухня?', a: ['Ціна залежить від розмірів, матеріалів і наповнення. Розрахуємо її під ваше завдання після безкоштовного заміру.'] },
  { q: 'Скільки часу займає виготовлення кухні?', a: ['Терміни залежать від проєкту кухні. Назвемо їх після заміру разом із ціною.'] },
  {
    q: 'Чи допомагаєте з побутовою технікою?',
    // Пока владелец не дал свой ответ — из подтверждённого списка того, что входит в монтаж
    a: has(facts.faq.appliances)
      ? [{ fact: facts.faq.appliances }]
      : ['Так. Під час монтажу вбудовуємо техніку, врізаємо мийку та варильну поверхню, підключаємо воду та розетки.'],
  },
  ...conditional,
  { q: 'Чи працюєте в області?', a: [`Так, приїжджаємо на замір і монтаж кухні: ${serviceArea.text}.`, ...areaTerms] },
  { q: 'Замір справді безкоштовний?', a: ['Так, замір кухні безкоштовний.'] },
];

/** Посадочная /mebli: шафи, гардеробні, передпокої, дитячі, меблі для бізнесу */
export const FAQ_MEBLI: FaqItem[] = [
  {
    q: 'Які меблі ви робите?',
    a: [`Корпусні меблі: ${services.furniture.filter((f) => f !== 'кухні').join(', ')}. Для таких об’єктів: ${services.objects.join(', ')}.`],
  },
  { q: 'Скільки коштує шафа або гардеробна?', a: ['Залежить від розмірів ніші, матеріалів і наповнення — полиць, штанг, шухляд. Порахуємо після безкоштовного заміру.'] },
  { q: 'Скільки часу займає виготовлення?', a: ['Залежить від проєкту: терміни назвемо разом із розрахунком після заміру.'] },
  { q: 'Чи робите меблі для офісу, магазину чи салону?', a: ['Так. Робимо корпусні меблі для офісів, магазинів і салонів — за вашими розмірами.'] },
  ...conditional,
  { q: 'Чи працюєте в області?', a: [`Так, працюємо по всій зоні: ${serviceArea.text}.`, ...areaTerms] },
  { q: 'Замір безкоштовний?', a: ['Так, приїжджаємо заміряти шафу чи інші меблі безкоштовно.'] },
];
