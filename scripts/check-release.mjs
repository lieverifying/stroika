// Защита боевой сборки (ARCHITECTURE.md 5.4, уровень 1). Запускается первым шагом npm run build.
// Режим запуска (решение владельца, 2026-10-21): «нет факта — нет блока». При SITE_ENV=production сборка падает, если:
//   — в src/content/facts.ts осталась заглушка {{NAME}} (так помечены только факты, без которых запуск невозможен);
//   — включён флаг блока, а его фактов нет (missing('NAME')) — блок показал бы пустое место;
//   — отправка заявок не подключена (facts.flags.leadSubmitEnabled = false, до фазы 6).
// Отсутствующие факты missing('NAME') сами по себе сборку не роняют: их блоки скрыты.
// В остальных случаях (не production) — ничего не делает.
// facts.ts импортируется напрямую: Node 24 запускает TypeScript без сборки.
import { loadEnv } from 'vite';

const env = { ...loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), ''), ...process.env };
if (env.SITE_ENV !== 'production') process.exit(0);

const { facts } = await import('../src/content/facts.ts');

const isMissing = (v) => v !== null && typeof v === 'object' && typeof v.missing === 'string' && Object.keys(v).length === 1;

/** Все заглушки {{NAME}} и отсутствующие факты внутри значения */
function scan(v, out = { placeholders: new Set(), missing: new Set() }) {
  if (typeof v === 'string') for (const [, name] of v.matchAll(/\{\{([A-Z0-9_]+)\}\}/g)) out.placeholders.add(name);
  else if (isMissing(v)) out.missing.add(v.missing);
  else if (Array.isArray(v)) v.forEach((x) => scan(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => scan(x, out));
  return out;
}
const at = (path) => path.split('.').reduce((o, k) => o?.[k], facts);

// Флаг блока → факты, без которых его нельзя включать
const FLAG_FACTS = {
  trustNumbers: ['trust', 'warranty.years'],
  reviews: ['reviews', 'google'],
  warrantyPayment: ['warranty', 'payment'],
  instagram: ['contacts.instagramHandle', 'contacts.tiktokHandle'],
  schedule: ['contacts.scheduleText'],
  address: ['contacts.address'],
  serviceAreaMap: ['serviceArea.map'],
  teamCards: ['team'],
  referralEnabled: ['referral'],
  seasonalBadge: ['seasonalBadgeText'],
};

const errors = [];
const { placeholders } = scan(facts);
if (placeholders.size) errors.push(`В facts.ts остались заглушки (${placeholders.size}): ${[...placeholders].sort().join(', ')}`);
for (const [flag, paths] of Object.entries(FLAG_FACTS)) {
  if (!facts.flags[flag]) continue;
  const lacking = new Set(paths.flatMap((p) => [...scan(at(p)).missing]));
  if (lacking.size) errors.push(`Флаг flags.${flag} включён, но нет фактов: ${[...lacking].sort().join(', ')}`);
}
if (facts.flags.quizResultVariant === 'A') {
  const lacking = scan([facts.prices, facts.quiz]).missing;
  if (lacking.size) errors.push(`Экран квиза с ценой (вариант А) включён, но нет фактов: ${[...lacking].sort().join(', ')}`);
}
if (!facts.flags.leadSubmitEnabled)
  errors.push('Отправка заявок не подключена (facts.flags.leadSubmitEnabled = false) — формы и квиз никуда не отправляют заявки');

if (errors.length) {
  console.error('✗ check-release: боевая сборка (SITE_ENV=production) запрещена');
  for (const e of errors) console.error(`  — ${e}`);
  process.exit(1);
}
console.log('✓ check-release: заглушек нет, флаги согласованы с фактами, отправка заявок подключена');
