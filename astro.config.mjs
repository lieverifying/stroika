// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

// Боевой домен — https://vymir.site (Namecheap, 2026-10-22); в сборку приходит из SITE_URL.
const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const SITE_URL = env.SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  env: {
    schema: {
      // development — локально и на техническом адресе (noindex); production — боевой домен
      SITE_ENV: envField.enum({
        context: 'client',
        access: 'public',
        values: ['development', 'production'],
        default: 'development',
      }),
      // Аналитика и Search Console (фаза 7): без значения соответствующий тег не выводится, сборка не падает.
      // Теги выводятся только при SITE_ENV=production. ID публичные — они видны в коде любой страницы.
      PUBLIC_GA4_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GADS_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GADS_LEAD: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_META_PIXEL_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      PUBLIC_GSC_VERIFICATION: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
