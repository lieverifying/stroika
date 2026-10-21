/**
 * Ссылки связи — единственный источник для всех компонентов (шапка, меню, панель, hero, футер).
 * Номера и логины берутся из facts.ts; пока там заглушки, ссылки нерабочие, но видно, что место ждёт данных.
 */
import { facts } from '../content/facts';
import { isMissing, telegramHref, telHref, viberHref } from './facts';

const c = facts.contacts;

export const contactLinks = {
  tel: telHref(c.phoneE164),
  viber: viberHref(c.viberPhoneE164),
  telegram: telegramHref(c.telegramUsername),
  // Нет факта — пустая строка; компонент такую ссылку не выводит (флаги facts.flags.instagram, has(emailPublic))
  instagram: isMissing(c.instagramHandle) ? '' : `https://www.instagram.com/${c.instagramHandle}`,
  tiktok: isMissing(c.tiktokHandle) ? '' : `https://www.tiktok.com/@${c.tiktokHandle}`,
  email: isMissing(c.emailPublic) ? '' : `mailto:${c.emailPublic}`,
} as const;
