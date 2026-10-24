// Картинки Open Graph 1200 × 630 для каждой страницы → public/og/<имя>.jpg (запуск: node scripts/og-images.mjs).
// Слева графитовая панель с логотипом и заголовком, справа фото работы. Шрифты бренда — из @fontsource, локально.
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const root = process.cwd();
// Шрифты и фото встраиваются data-URI: страница из setContent не может читать локальные файлы
const MIME = { woff2: 'font/woff2', webp: 'image/webp', png: 'image/png' };
const file = async (p) => `data:${MIME[p.split('.').pop()]};base64,${(await readFile(`${root}/${p}`)).toString('base64')}`;
const PAGES = [
  ['home', 'public/portfolio/img/kukhni/kukhnia-05.webp', 'Меблі, які точно підходять'],
  ['kukhni', 'public/portfolio/img/kukhni/kukhnia-06.webp', 'Кухні на замовлення в Черкасах та області'],
  ['mebli', 'public/portfolio/img/shafy/shafa-01.webp', 'Шафи, гардеробні та меблі під ваш розмір'],
  ['roboty', 'public/portfolio/img/kukhni/kukhnia-11.webp', 'Роботи нашої команди'],
  ['yak-my-stvoriuiemo', 'src/assets/stories/kitchen/kitchen-07-ready.png', 'Як ми створюємо'],
  ['kontakty', 'public/portfolio/img/kukhni/kukhnia-09.webp', 'Контакти'],
  ['polityka', 'public/portfolio/img/kukhni/kukhnia-14.webp', 'Політика конфіденційності'],
];
const logo = await readFile(`${root}/public/brand/logo-dark.svg`, 'utf8');
const css = String.raw`
  @font-face { font-family: Unbounded; font-weight: 500; src: url(${await file('node_modules/@fontsource/unbounded/files/unbounded-cyrillic-500-normal.woff2')}) format('woff2'); unicode-range: U+0400-04FF; }
  @font-face { font-family: Unbounded; font-weight: 500; src: url(${await file('node_modules/@fontsource/unbounded/files/unbounded-latin-500-normal.woff2')}) format('woff2'); unicode-range: U+0000-00FF, U+2014; }
  @font-face { font-family: Manrope; font-weight: 600; src: url(${await file('node_modules/@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2')}) format('woff2'); unicode-range: U+0400-04FF; }
  @font-face { font-family: Manrope; font-weight: 600; src: url(${await file('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')}) format('woff2'); unicode-range: U+0000-00FF, U+00B7; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; display: grid; grid-template-columns: 600px 600px; background: #1E2124; }
  .panel { padding: 64px 56px; display: flex; flex-direction: column; justify-content: space-between; color: #F1F1EE; }
  .logo svg { width: 260px; height: auto; }
  h1 { font-family: Unbounded; font-weight: 500; font-size: 54px; line-height: 1.12; }
  .area { font-family: Manrope; font-weight: 600; font-size: 26px; color: #A3A8AD; }
  .photo { background-size: cover; background-position: center; }
`;
await mkdir(`${root}/public/og`, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [name, photo, title] of PAGES) {
  await page.setContent(
    `<html><head><style>${css}</style></head><body><div class="panel"><div class="logo">${logo}</div><h1>${title}</h1><p class="area">Кухні, шафи та гардеробні · Черкаси</p></div><div class="photo" style="background-image:url(${await file(photo)})"></div></body></html>`,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${root}/public/og/${name}.jpg`, type: 'jpeg', quality: 86 });
  console.log('og', name);
}
await browser.close();
