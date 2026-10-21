/**
 * Портфолио «Наші роботи» (решение владельца, 2026-10-21): реальные фото и видео из архива владельца.
 * Файлы — public/portfolio/ (уже WebP: большое фото до 1600 px и превью до 640 px; видео H.264 без звука).
 * Список, категории, подписи и выбор для главной — только src/content/portfolio.json, в разметке не дублируются.
 */
import data from '../content/portfolio.json';
import { facts } from '../content/facts';

export type PortfolioCategory = 'kuhni' | 'shafy' | 'interier' | 'komertsiia';

interface Base {
  id: string;
  category: PortfolioCategory;
  src: string;
  width: number;
  height: number;
  alt: string;
}
export interface PortfolioPhoto extends Base {
  type: 'photo';
  thumb: string;
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

const byId = (id: string) => {
  const item = ITEMS.find((i) => i.id === id);
  if (!item) throw new Error(`portfolio.json: нет работы «${id}»`);
  return item;
};

/** 6 работ для блока «Наші роботи» на посадочной — в порядке featured (подобран по пропорциям, по 2 в ряд) */
export const FEATURED = {
  kukhni: data.featured.kukhni.map(byId),
  mebli: data.featured.mebli.map(byId),
};

export const photoById = (id: string) => byId(id) as PortfolioPhoto;

/** Фото первого экрана — id из facts.media.hero */
export const HERO = byId(facts.media.hero) as PortfolioPhoto;
