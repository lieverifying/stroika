/**
 * Вопросы и ответы (ТЗ, блок 12): сроки, цена, материалы, гарантия, техника, выезд в область, оплата, замер.
 * Ответы собираются только из facts.ts: факт — отдельная часть ответа, пока заглушка — видна плашкой.
 * Текст между фактами — шаблон без цифр и обещаний.
 */
import { facts, type Brand, type Fact } from './facts';
import { formatUAH, isPlaceholder, pluralUk } from '../lib/facts';

/** Часть ответа: обычный текст или факт (с форматом для настоящего значения) */
export type AnswerPart = string | { fact: Fact<string | number>; format?: (v: never) => string };

export interface FaqItem {
  q: string;
  a: AnswerPart[];
}

/** Список брендов → строка названий; заглушку оставляем заглушкой */
const brandNames = (brands: Fact<Brand[]>): Fact<string> =>
  isPlaceholder(brands) ? brands : brands.map((b) => b.name).join(', ');

const DAYS: [string, string, string] = ['день', 'дні', 'днів'];
const { terms, prices, warranty, payment, serviceArea, materials } = facts;

export const FAQ: FaqItem[] = [
  {
    q: 'Скільки часу займає виготовлення кухні?',
    a: [
      'Виготовлення — ',
      { fact: terms.productionDaysTotal },
      ` ${pluralUk(terms.productionDaysTotal, DAYS)}. Від заміру до монтажу — `,
      { fact: terms.measureToInstallDays },
      ` ${pluralUk(terms.measureToInstallDays, DAYS)}.`,
    ],
  },
  {
    q: 'Скільки коштує кухня?',
    a: [
      'Пряма кухня — від ',
      { fact: prices.from.kitchenPryama, format: formatUAH },
      ', кутова — від ',
      { fact: prices.from.kitchenKutova, format: formatUAH },
      ', з островом — від ',
      { fact: prices.from.kitchenOstriv, format: formatUAH },
      '. Точну ціну рахуємо після заміру.',
    ],
  },
  {
    q: 'З яких матеріалів і з якою фурнітурою робите?',
    a: ['Матеріали: ', { fact: brandNames(materials.materialBrands) }, '. Фурнітура: ', { fact: brandNames(materials.hardwareBrands) }, '.'],
  },
  {
    q: 'Яка гарантія?',
    a: ['Гарантія — ', { fact: warranty.years }, ` ${pluralUk(warranty.years, ['рік', 'роки', 'років'])}. `, { fact: warranty.terms }],
  },
  {
    q: 'Чи допомагаєте з побутовою технікою?',
    a: [{ fact: facts.faq.appliances }],
  },
  {
    q: 'Чи працюєте в області?',
    a: [{ fact: serviceArea.text }, ' ', { fact: serviceArea.terms }],
  },
  {
    q: 'Як відбувається оплата?',
    a: ['Передоплата — ', { fact: payment.prepayPercent }, ' %. ', { fact: payment.schedule }],
  },
  {
    q: 'Замір справді безкоштовний?',
    a: ['Так, замір безкоштовний.'],
  },
];
