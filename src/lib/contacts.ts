/**
 * Ссылки связи — единственный источник для всех компонентов (шапка, меню, панель, hero, футер).
 * Номера и логины берутся из facts.ts; пока там заглушки, ссылки нерабочие, но видно, что место ждёт данных.
 */
import { facts } from '../content/facts';
import { telegramHref, telHref, viberHref } from './facts';

const c = facts.contacts;

export const contactLinks = {
  tel: telHref(c.phoneE164),
  viber: viberHref(c.viberPhoneE164),
  telegram: telegramHref(c.telegramUsername),
} as const;
