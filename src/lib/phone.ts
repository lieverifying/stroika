/**
 * Телефон Украины: маска ввода «+380 XX XXX XX XX» и нормализация к +380XXXXXXXXX (E.164).
 * Принимаем любые привычные записи: 0671234567, 380671234567, +38 (067) 123-45-67, 671234567.
 * Без зависимостей: используется и в браузере (маска), и при сборке/тестах.
 */

/** 9 цифр национального номера (код оператора + абонент) из любой записи; лишнее отбрасываем */
export function nationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('380')) d = d.slice(3);
  else if (d.startsWith('80') && d.length >= 11) d = d.slice(2);
  // Ведущий 0 — «междугородний» префикс: и в 0671234567, и когда в поле уже «+380 » набирают 067…
  // Код оператора с 0 не начинается, поэтому 0 всегда лишний.
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 9);
}

/** Номер в E.164 (+380XXXXXXXXX) или null, если цифр не хватает */
export function normalizePhone(raw: string): string | null {
  const d = nationalDigits(raw);
  return d.length === 9 ? `+380${d}` : null;
}

/** Маска для поля: «+380 67 123 45 67», по мере ввода. Пустой ввод — пустая строка. */
export function maskPhone(raw: string): string {
  // «+38», «+3», «+» — стирают подставленный код страны Backspace'ом: поле очищается, а не застревает на «+380 38»
  const t = raw.trim();
  if (t !== '+380' && '+380'.startsWith(t)) return '';
  const d = nationalDigits(raw);
  if (!d && !/\d/.test(raw)) return '';
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return ['+380', ...parts].join(' ');
}
