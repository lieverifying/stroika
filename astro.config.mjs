// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

// Домен ещё не зарегистрирован (кандидаты vymir.ua / vymir.com.ua) — берём из SITE_URL.
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
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
