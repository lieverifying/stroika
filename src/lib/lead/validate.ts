/**
 * Валидация полей заявки (PLAN 4.6). Чистые функции: null — поле верно,
 * строка — текст ошибки на украинском, который показывается рядом с полем.
 */
import { normalizePhone } from '../phone';

const NAME_MIN = 2;
const NAME_MAX = 50;
const TASK_MIN = 3;

export function validateName(value: string): string | null {
  const len = value.trim().length;
  if (len === 0) return 'Вкажіть, як до вас звертатися';
  if (len < NAME_MIN) return `Ім’я має містити щонайменше ${NAME_MIN} символи`;
  if (len > NAME_MAX) return `Ім’я не довше ${NAME_MAX} символів`;
  return null;
}

export function validatePhone(value: string): string | null {
  return normalizePhone(value) !== null ? null : 'Вкажіть номер у форматі +380 XX XXX XX XX';
}

export function validateConsent(checked: boolean): string | null {
  return checked ? null : 'Потрібна ваша згода';
}

/** Поле «Що потрібно зробити» короткої формы */
export function validateTask(value: string): string | null {
  return value.trim().length >= TASK_MIN ? null : 'Опишіть, що потрібно зробити';
}
