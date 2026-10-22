// robots.txt: боевой сайт открыт для поиска и ссылается на sitemap; закрыт только приёмник заявок /api/.
// Лендинги под рекламу и /dyakuyemo здесь не закрываем: у них meta noindex, а Disallow не дал бы роботу его прочитать
// (и помешал бы Meta проверить страницу объявления). Любая другая сборка (локально, тестовый домен) закрыта целиком.
import type { APIRoute } from 'astro';
import { SITE_ENV } from 'astro:env/client';

export const GET: APIRoute = ({ site }) => {
  const body =
    SITE_ENV === 'production'
      ? ['User-agent: *', 'Disallow: /api/', '', `Sitemap: ${new URL('/sitemap.xml', site).href}`, ''].join('\n')
      : ['User-agent: *', 'Disallow: /', ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
