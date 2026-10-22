// sitemap.xml — только индексируемые страницы боевого сайта (лендинги под рекламу, «Дякуємо» и 404 — noindex, их здесь нет)
import type { APIRoute } from 'astro';

export const PAGES = ['/', '/kukhni', '/mebli', '/roboty', '/yak-my-stvoriuiemo', '/kontakty', '/polityka'];

export const GET: APIRoute = ({ site }) => {
  const urls = PAGES.map((p) => `  <url><loc>${new URL(p, site).href.replace(/\/$/, p === '/' ? '/' : '')}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
