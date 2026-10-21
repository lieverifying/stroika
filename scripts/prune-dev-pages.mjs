// Служебные страницы (витрина компонентов /styleguide) в боевую сборку не попадают: на сайте не должно быть плашек-заглушек.
import { rm } from 'node:fs/promises';
import { loadEnv } from 'vite';

const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
if (env.SITE_ENV === 'production') {
  await rm('dist/styleguide.html', { force: true });
  await rm('dist/styleguide', { recursive: true, force: true });
  console.log('✓ prune-dev-pages: /styleguide убрана из боевой сборки');
}
