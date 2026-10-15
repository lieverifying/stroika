// Ищет запрещённое слово из CLAUDE.md, п.3, во всех падежах (рус. и укр.) в src/, public/ и dist/.
// Шаблон хранится в base64, чтобы само слово не попадало в репозиторий. Находка → код выхода 1.
import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const PATTERN = new RegExp(Buffer.from('0LzQsNGBezEsMn3QuNCy', 'base64').toString('utf8'), 'iu');
const ROOTS = ['src', 'public', 'dist'];
const TEXT_EXT = new Set(['.astro', '.ts', '.js', '.mjs', '.css', '.md', '.mdx', '.json', '.html', '.svg', '.xml', '.txt', '.php']);

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return; // папки может не быть (например, dist до сборки)
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (TEXT_EXT.has(extname(e.name))) yield p;
  }
}

const hits = [];
for (const root of ROOTS) {
  for await (const file of walk(root)) {
    const lines = (await readFile(file, 'utf8')).split('\n');
    lines.forEach((line, i) => {
      if (PATTERN.test(line)) hits.push(`${file}:${i + 1}`);
    });
  }
}

if (hits.length) {
  console.error('✗ Найдено запрещённое слово (CLAUDE.md, п.3):');
  for (const h of hits) console.error('  ' + h);
  process.exit(1);
}
console.log('✓ check-words: запрещённого слова нет');
