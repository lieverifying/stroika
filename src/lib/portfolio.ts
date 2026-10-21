/**
 * Портфолио «Наші роботи» (решение владельца, 2026-10-21): реальные фото и видео из архива владельца.
 * Файлы — public/portfolio/ (уже WebP: большое фото до 1600 px и копии шириной 480 и 960 px, см. responsive()). Источник — архив vymir-foto
 * после ретуши (ТЗ v2, 2026-10-21); других фото на сайте нет.
 * Список, категории, подписи и выбор для главной — только src/content/portfolio.json, в разметке не дублируются.
 */
import data from '../content/portfolio.json';
import { facts } from '../content/facts';

export type PortfolioCategory = 'kukhni' | 'shafy' | 'garderobni' | 'inshi';

interface Base {
  id: string;
  category: PortfolioCategory;
  src: string;
  width: number;
  height: number;
  /** Точка кадра при обрезке до карточки (CSS object-position) */
  focus?: string;
  alt: string;
}
export interface PortfolioPhoto extends Base {
  type: 'photo';
}
export interface PortfolioVideo extends Base {
  type: 'video';
  poster: string;
}
export type PortfolioItem = PortfolioPhoto | PortfolioVideo;

export const PORTFOLIO_BASE = data.base;
export const CATEGORIES = data.categories as { id: PortfolioCategory; title: string }[];
export const ITEMS = data.items as PortfolioItem[];

/** Путь к файлу на сайте */
export const url = (path: string) => `${PORTFOLIO_BASE}${path}`;

/**
 * Адаптивные размеры фото: рядом с большим файлом лежат -480.webp и -960.webp (ширина 480 и 960 px).
 * src — 960 (подходит большинству телефонов), srcset — браузер сам берёт нужный под ширину и плотность экрана.
 */
export function responsive(item: { src: string; width: number }) {
  const w = (n: number) => Math.min(n, item.width);
  const v = (n: number) => url(item.src.replace(/\.webp$/, `-${n}.webp`));
  // Фото уже не шире 960 — большой файл того же размера в srcset не повторяем (дубли ширины браузер отбрасывает)
  const full = item.width > 960 ? `, ${url(item.src)} ${item.width}w` : '';
  return { src: v(960), srcset: `${v(480)} ${w(480)}w, ${v(960)} ${w(960)}w${full}` };
}

const byId = (id: string) => {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`portfolio.json: нет работы «${id}»`);
  return item;
};

/** Работы для блока «Наші роботи»: главная (6 разных категорий), /kukhni (6 кухонь), /mebli (шафи, гардеробна, ТВ-зона) */
export const FEATURED = {
  home: data.featured.home.map(byId),
  kukhni: data.featured.kukhni.map(byId),
  mebli: data.featured.mebli.map(byId),
};

export const photoById = (id: string) => byId(id) as PortfolioPhoto;

/** Фото первого экрана /kukhni — id из facts.media.hero */
export const HERO = byId(facts.media.hero) as PortfolioPhoto;
