/**
 * Кейсы портфолио: выборки, подписи, alt (ARCHITECTURE.md 3.4).
 * В боевой сборке (SITE_ENV=production) демо-кейсы и черновики исключаются.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE_ENV } from 'astro:env/client';
import { facts, type Fact } from '../content/facts';
import { isPlaceholder } from './facts';

export type Case = CollectionEntry<'cases'>;
export type KitchenShape = NonNullable<Case['data']['kitchenShape']>;

/** Подписи форм кухни: фильтр на главной и подпись карточки */
export const KITCHEN_SHAPES: Record<KitchenShape, string> = {
  pryama: 'Пряма',
  kutova: 'Кутова',
  'p-podibna': 'П-подібна',
  ostriv: 'З островом',
};

const isProduction = SITE_ENV === 'production';

/** Все кейсы, которые можно показать в текущей сборке, свежие первыми */
export async function getVisibleCases(): Promise<Case[]> {
  const all = await getCollection('cases', ({ data }) => !(isProduction && (data.placeholder || data.draft)));
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Кейсы для главной (блок 3): featured, по featuredOrder, затем по дате */
export async function getFeaturedCases(limit = 6): Promise<Case[]> {
  const featured = (await getVisibleCases()).filter((c) => c.data.featured);
  return featured
    .sort((a, b) => (a.data.featuredOrder ?? Infinity) - (b.data.featuredOrder ?? Infinity))
    .slice(0, limit);
}

/** Район города или населённый пункт области (по списку facts.serviceArea.cityDistricts) */
function placeText(district: string): string {
  // тип шире литерала: после подтверждения владельцем здесь будет список районов
  const cityDistricts = facts.serviceArea.cityDistricts as Fact<string[]>;
  const inCity = isPlaceholder(cityDistricts) || cityDistricts.includes(district);
  return inCity ? `Черкаси, район ${district}` : `${district}, Черкаська область`;
}

/**
 * Alt фото кейса: свой alt, если задан; иначе «{altBase}, Черкаси, район {district}»,
 * для второго и следующих фото — «, фото {n}». i — номер фото с нуля (0 — обложка).
 */
export function buildAlt(c: Case, i = 0, own?: string): string {
  if (own) return own;
  const base = `${c.data.altBase}, ${placeText(c.data.district)}`;
  return i > 0 ? `${base}, фото ${i + 1}` : base;
}
