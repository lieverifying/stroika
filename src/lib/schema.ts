/**
 * JSON-LD для поисковиков: LocalBusiness — на всех индексируемых страницах, FAQPage — на посадочных с вопросами.
 * Только факты из facts.ts: адреса и часов работы нет, пока нет фактов.
 */
import { facts } from '../content/facts';
import type { FaqItem } from '../content/faq';
import { contactLinks } from './contacts';

export function localBusiness(site: URL | undefined): Record<string, unknown> {
  const base = site ?? new URL('https://vymir.site');
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Вимір',
    description: 'Кухні, шафи та гардеробні на замовлення. Замір, дизайн-проєкт і монтаж.',
    url: new URL('/', base).href,
    image: new URL('/og/home.jpg', base).href,
    logo: new URL('/brand/logo.svg', base).href,
    telephone: facts.contacts.phoneE164,
    address: { '@type': 'PostalAddress', addressLocality: 'Черкаси', addressRegion: 'Черкаська область', addressCountry: 'UA' },
    areaServed: { '@type': 'AdministrativeArea', name: 'Черкаська область' },
    sameAs: [contactLinks.instagram, contactLinks.tiktok].filter(Boolean),
  };
}

/** FAQPage из вопросов посадочной; ответ — текстом (части-факты подставляются строкой) */
export function faqPage(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a.map((p) => (typeof p === 'string' ? p : String(p.fact))).join('') },
    })),
  };
}
