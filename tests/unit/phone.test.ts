// Юнит-тесты маски и нормализации телефона: node --test (Node 24 запускает TypeScript без сборки)
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { maskPhone, normalizePhone } from '../../src/lib/phone.ts';

test('разные записи одного номера приводятся к +380671234567', () => {
  for (const raw of ['0671234567', '380671234567', '+380671234567', '+38 (067) 123-45-67', '671234567', '80671234567', '+380 0671234567']) {
    assert.equal(normalizePhone(raw), '+380671234567', raw);
  }
});

test('неполный номер — null', () => {
  assert.equal(normalizePhone('067123'), null);
  assert.equal(normalizePhone(''), null);
});

test('маска по мере ввода', () => {
  assert.equal(maskPhone(''), '');
  assert.equal(maskPhone('0'), '+380');
  assert.equal(maskPhone('067'), '+380 67');
  assert.equal(maskPhone('0671234'), '+380 67 123 4');
  assert.equal(maskPhone('0671234567'), '+380 67 123 45 67');
  assert.equal(maskPhone('+380 67 123 45 67 89'), '+380 67 123 45 67');
});

test('Backspace по коду страны очищает поле', () => {
  assert.equal(maskPhone('+380'), '+380');
  assert.equal(maskPhone('+38'), '');
  assert.equal(maskPhone('+3'), '');
  assert.equal(maskPhone('+'), '');
});
