// Скриншоты для docs/screens/.
// Использование: npm run screens -- --path=/ --name=2-9-hero [--widths=320,375,1280] [--fold] [--click=<css>]
//   --fold  — только первый экран (без прокрутки), иначе вся страница.
//   --click — нажать элемент перед снимком.
//   --scroll — прокрутить страницу на N px перед снимком (вместе с --fold).
//   --to    — прокрутить к элементу (верх элемента под шапку), напр. --to='[data-block="4"]'.
//   --css   — добавить CSS перед снимком (сравнить вариант, не меняя код), напр. --css='h1{font-weight:600}'.
// Перед запуском нужен свежий `npm run build`: скрипт сам поднимает astro preview.
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    // делим только по первому «=»: в --click и --css значение само может содержать «=»
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    return [k, rest.length ? rest.join('=') : true];
  }),
);

const path = typeof args.path === 'string' ? args.path : '/';
const name = typeof args.name === 'string' ? args.name : 'screen';
const widths = (typeof args.widths === 'string' ? args.widths : '375,1280').split(',').map(Number);
const fold = Boolean(args.fold);
const cssArg = typeof args.css === 'string' ? args.css : undefined;
const PORT = 4399;
const base = `http://localhost:${PORT}`;

// Высота окна: телефон 812, планшет 1024, десктоп 800
const heightFor = (w) => (w < 768 ? 812 : w < 1024 ? 1024 : 800);

async function waitForServer(url, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404) return;
    } catch {
      // сервер ещё не поднялся
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Сервер ${url} не ответил за ${timeoutMs} мс`);
}

// Отдельная группа процессов: в конце завершаем её целиком (npx порождает дочерний astro)
const server = spawn('npx', ['astro', 'preview', '--port', String(PORT), '--ignore-lock'], {
  stdio: 'ignore',
  detached: true,
});

try {
  await waitForServer(base);
  await mkdir('docs/screens', { recursive: true });
  const browser = await chromium.launch();
  for (const width of widths) {
    const mobile = width < 1024;
    const context = await browser.newContext({
      viewport: { width, height: heightFor(width) },
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: mobile,
      hasTouch: mobile,
      locale: 'uk-UA',
    });
    const page = await context.newPage();
    await page.goto(base + path, { waitUntil: 'networkidle' });
    if (cssArg) await page.addStyleTag({ content: cssArg });
    await page.evaluate(() => document.fonts.ready);
    // --click=<css> — нажать элемент перед снимком (например, открыть меню)
    if (typeof args.click === 'string') await page.click(args.click);
    if (typeof args.to === 'string') {
      await page.locator(args.to).first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 16));
      await page.waitForTimeout(400);
    }
    if (typeof args.scroll === 'string') {
      await page.evaluate((y) => window.scrollTo(0, y), Number(args.scroll));
      await page.waitForTimeout(400); // IntersectionObserver и переходы
    }
    const file = `docs/screens/${name}-${width}.png`;
    await page.screenshot({ path: file, fullPage: !fold });
    console.log(`✓ ${file}`);
    await context.close();
  }
  await browser.close();
} finally {
  try {
    process.kill(-server.pid);
  } catch {
    // сервер уже завершён
  }
}
