// Юнит-тесты маски и нормализации телефона (Vitest)
import { expect, test } from 'vitest';
import { maskPhone, normalizePhone } from '../../src/lib/phone';

test('разные записи одного номера приводятся к +380671234567', () => {
  for (const raw of ['0671234567', '380671234567', '+380671234567', '+38 (067) 123-45-67', '671234567', '80671234567', '+380 0671234567']) {
    expect(normalizePhone(raw), raw).toBe('+380671234567');
  }
});

test('код страны, набранный ещё раз после подставленного «+380 », не дублируется', () => {
  for (const raw of ['+380 380671234567', '+380 38 067 12 34567', '+380 80671234567', '+380 3800671234567', '+380 +380 67 123 45 67']) {
    expect(normalizePhone(raw), raw).toBe('+380671234567');
    expect(maskPhone(raw), raw).toBe('+380 67 123 45 67');
  }
});

test('00, +38 без 0 и повтор кода — тот же номер', () => {
  for (const raw of ['00380671234567', '0038 067 123 45 67', '+380 00380671234567', '+38 67 123 45 67', '+38 (67) 123-45-67', '38671234567', '+380 +38 67 123 45 67']) {
    expect(normalizePhone(raw), raw).toBe('+380671234567');
  }
});

test('лишняя цифра — ошибка, а не чужой номер', () => {
  for (const raw of ['06712345678', '3806712345678', '+380 67 1234 4567', '067 122 344 56 7']) {
    expect(normalizePhone(raw), raw).toBe(null);
  }
});

test('набор по одной цифре поверх «+380 »', () => {
  let v = '+380 ';
  for (const ch of '0671234567') v = maskPhone(v + ch);
  expect(v).toBe('+380 67 123 45 67');
  v = '+380 ';
  for (const ch of '380671234567') v = maskPhone(v + ch);
  expect(v).toBe('+380 67 123 45 67');
  expect(maskPhone('+380 6')).toBe('+380 6');
});

test('недописанный номер с повторным кодом — ошибка, а не «+380 38…» / «+380 80…»', () => {
  for (const raw of ['+380 38 067 12 34', '+380 380671234', '+380 806712345', '+380 386712345', '+380 382123456']) {
    expect(normalizePhone(raw), raw).toBe(null);
  }
});

test('неполный номер — null', () => {
  expect(normalizePhone('067123')).toBe(null);
  expect(normalizePhone('')).toBe(null);
});

test('маска по мере ввода', () => {
  expect(maskPhone('')).toBe('');
  expect(maskPhone('0')).toBe('+380');
  expect(maskPhone('067')).toBe('+380 67');
  expect(maskPhone('0671234')).toBe('+380 67 123 4');
  expect(maskPhone('0671234567')).toBe('+380 67 123 45 67');
  // лишние цифры не отрезаются: номер с опечаткой виден и не проходит проверку
  expect(maskPhone('+380 67 123 45 67 89')).toBe('+380 67 123 45 67 89');
});

test('Backspace по коду страны очищает поле', () => {
  expect(maskPhone('+380')).toBe('+380');
  expect(maskPhone('+38')).toBe('');
  expect(maskPhone('+3')).toBe('');
  expect(maskPhone('+')).toBe('');
});
