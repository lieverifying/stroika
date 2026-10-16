// Юнит-тесты маски и нормализации телефона (Vitest)
import { expect, test } from 'vitest';
import { maskPhone, normalizePhone } from '../../src/lib/phone';

test('разные записи одного номера приводятся к +380671234567', () => {
  for (const raw of ['0671234567', '380671234567', '+380671234567', '+38 (067) 123-45-67', '671234567', '80671234567', '+380 0671234567']) {
    expect(normalizePhone(raw), raw).toBe('+380671234567');
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
  expect(maskPhone('+380 67 123 45 67 89')).toBe('+380 67 123 45 67');
});

test('Backspace по коду страны очищает поле', () => {
  expect(maskPhone('+380')).toBe('+380');
  expect(maskPhone('+38')).toBe('');
  expect(maskPhone('+3')).toBe('');
  expect(maskPhone('+')).toBe('');
});
