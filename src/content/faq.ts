/**
 * Вопросы и ответы (ТЗ, блок 12): сроки и цена — без цифр (считаем под задачу, 2026-10-21), какие меблі, материалы, гарантия, техника, выезд в область, оплата, замер;
 * вопрос о рекомендациях — только при facts.flags.referralEnabled.
 * Ответы собираются только из facts.ts: факт — отдельная часть ответа, пока заглушка — видна плашкой.
 * Текст между фактами — шаблон без цифр и обещаний.
 */
import { facts, type Brand, type Fact } from './facts';
import { isPlaceholder, pluralUk } from '../lib/facts';

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

export const FAQ: FaqItem[] = [
  {
    q: 'Скільки часу займає виготовлення?',
    a: ['Терміни залежать від проєкту. Назвемо їх після заміру разом із ціною.'],
  },
  {
    q: 'Які меблі ви робите?',
    a: [
      `Корпусні меблі: ${services.furniture.join(', ')}. Для таких об’єктів: ${services.objects.join(', ')}.`,
    ],
  },
  {
    q: 'Скільки коштує кухня?',
    a: ['Ціна залежить від розмірів, матеріалів і наповнення. Розрахуємо її під ваше завдання після безкоштовного заміру.'],
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
    a: [`Так, працюємо: ${serviceArea.text.toLowerCase()}. `, { fact: serviceArea.terms }],
  },
  {
    q: 'Як відбувається оплата?',
    a: ['Передоплата — ', { fact: payment.prepayPercent }, ' %. ', { fact: payment.schedule }],
  },
  {
    q: 'Замір справді безкоштовний?',
    a: ['Так, замір безкоштовний.'],
  },
  ...(facts.flags.referralEnabled
    ? [
        {
          q: 'Чи є бонус, якщо порекомендувати вас друзям?',
          a: ['Так. Вам — ', { fact: referral.reward }, ', другові — ', { fact: referral.friendBonus }, '.'],
        },
      ]
    : []),
];
