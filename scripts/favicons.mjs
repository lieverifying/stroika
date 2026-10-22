// Иконки сайта из public/favicon.svg (знак «Кутник» на графите): favicon.ico (16 + 32 px), favicon-32.png,
// apple-touch-icon.png (180 px). Safari во вкладках и iOS на «Домой» берут их, а не SVG. Запуск: node scripts/favicons.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile('public/favicon.svg');
const png = (size) => sharp(svg, { density: 512 }).resize(size, size).png().toBuffer();

const [p16, p32, p180] = await Promise.all([png(16), png(32), png(180)]);
await writeFile('public/favicon-32.png', p32);
await writeFile('public/apple-touch-icon.png', p180);

// ICO с PNG внутри (поддерживают все браузеры): заголовок 6 байт + записи по 16 байт + данные
const images = [
  [16, p16],
  [32, p32],
];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(([size, data]) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size, 0);
  e.writeUInt8(size, 1);
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += data.length;
  return e;
});
await writeFile('public/favicon.ico', Buffer.concat([header, ...entries, ...images.map(([, d]) => d)]));
console.log('favicon.ico, favicon-32.png, apple-touch-icon.png');
