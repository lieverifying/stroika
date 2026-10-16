// Защита боевой сборки (ARCHITECTURE.md 5.4, уровень 1). Запускается первым шагом npm run build.
// При SITE_ENV=production сборка падает, если:
//   — в src/content/facts.ts осталась хоть одна заглушка {{NAME}};
//   — отправка заявок не подключена (facts.flags.leadSubmitEnabled = false, до фазы 6).
// В остальных случаях — ничего не делает (локально и на техническом адресе заглушки разрешены).
// facts.ts импортируется напрямую: Node 24 запускает TypeScript без сборки.
import { loadEnv } from 'vite';

const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
if (env.SITE_ENV !== 'production') process.exit(0);

const { facts } = await import('../src/content/facts.ts');

const found = new Set();
const walk = (v) => {
  if (typeof v === 'string') for (const [, name] of v.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) found.add(name);
  else if (Array.isArray(v)) v.forEach(walk);
  else if (v && typeof v === 'object') Object.values(v).forEach(walk);
};
walk(facts);

const errors = [];
if (found.size) errors.push(`В facts.ts остались заглушки (${found.size}): ${[...found].sort().join(', ')}`);
if (!facts.flags.leadSubmitEnabled)
  errors.push('Отправка заявок не подключена (facts.flags.leadSubmitEnabled = false) — формы и квиз никуда не отправляют заявки');

if (errors.length) {
  console.error('✗ check-release: боевая сборка (SITE_ENV=production) запрещена');
  for (const e of errors) console.error(`  — ${e}`);
  process.exit(1);
}
console.log('✓ check-release: заглушек нет, отправка заявок подключена');
