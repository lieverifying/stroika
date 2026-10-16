// Юнит-тесты валидации полей заявки (PLAN 4.6)
import { describe, expect, test } from 'vitest';
import { validateConsent, validateName, validatePhone, validateTask } from '../../src/lib/lead/validate';

describe('validateName', () => {
  test('2 символа — граница, валидно', () => expect(validateName('Іа')).toBeNull());
  test('50 символов — граница, валидно', () => expect(validateName('а'.repeat(50))).toBeNull());
  test('51 символ — ошибка', () => expect(validateName('а'.repeat(51))).toMatch(/50/));
  test('1 символ — ошибка', () => expect(validateName('І')).toMatch(/2/));
  test('пусто — просьба указать имя', () => expect(validateName('')).toBe('Вкажіть, як до вас звертатися'));
  test('только пробелы — как пусто', () => expect(validateName('   ')).toBe('Вкажіть, як до вас звертатися'));
  test('пробелы по краям обрезаются', () => {
    expect(validateName('  І  ')).not.toBeNull();
    expect(validateName('  Ір  ')).toBeNull();
  });
  test('юникод и эмодзи принимаются по длине', () => expect(validateName('Ґеорґій')).toBeNull());
});

describe('validatePhone', () => {
  const msg = 'Вкажіть номер у форматі +380 XX XXX XX XX';
  test.each(['0671234567', '+380671234567', '+38 (067) 123-45-67', '671234567'])('валидный: %s', (v) =>
    expect(validatePhone(v)).toBeNull(),
  );
  test.each(['', '   ', '067123456', 'abc', '+380 67 123'])('невалидный: «%s»', (v) =>
    expect(validatePhone(v)).toBe(msg),
  );
});

describe('validateConsent', () => {
  test('false — ошибка', () => expect(validateConsent(false)).toBe('Потрібна ваша згода'));
  test('true — валидно', () => expect(validateConsent(true)).toBeNull());
});

describe('validateTask', () => {
  const msg = 'Опишіть, що потрібно зробити';
  test('3 символа — граница, валидно', () => expect(validateTask('abc')).toBeNull());
  test('2 символа — ошибка', () => expect(validateTask('ab')).toBe(msg));
  test('пусто и пробелы — ошибка', () => {
    expect(validateTask('')).toBe(msg);
    expect(validateTask('    ')).toBe(msg);
  });
  test('пробелы по краям обрезаются', () => expect(validateTask(' ab ')).toBe(msg));
});
