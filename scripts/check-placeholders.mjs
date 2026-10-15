// Отчёт по незаменённым заглушкам {{NAME}} в собранном сайте (dist/).
// Без флагов — только отчёт. С --strict (боевая сборка) — код выхода 1, если заглушки есть.
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const strict = process.argv.includes('--strict');
const EXT = new Set(['.html', '.js', '.json', '.xml', '.txt']);
const RE = /\{\{([A-Z0-9_]+)\}\}/g;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (EXT.has(extname(e.name))) yield p;
  }
}

const byName = new Map();
try {
  for await (const file of walk('dist')) {
    const text = await readFile(file, 'utf8');
    for (const [, name] of text.matchAll(RE)) {
      if (!byName.has(name)) byName.set(name, new Set());
      byName.get(name).add(file);
    }
  }
} catch {
  console.error('Нет папки dist/: сначала npm run build');
  process.exit(1);
}

if (byName.size === 0) {
  console.log('✓ check-placeholders: заглушек нет');
  process.exit(0);
}

console.log(`Заглушек в dist/: ${byName.size}`);
for (const [name, files] of [...byName].sort()) {
  console.log(`  ${name}  (${[...files].join(', ')})`);
}
if (strict) {
  console.error('✗ Боевая сборка с заглушками запрещена');
  process.exit(1);
}
