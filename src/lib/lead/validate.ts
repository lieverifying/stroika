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

/** «Нестандартне завдання»: описание 10–1000 символов */
export const REQUEST_MIN = 10;
export const REQUEST_MAX = 1000;

export function validateRequest(value: string): string | null {
  const len = value.trim().length;
  if (len < REQUEST_MIN) return `Опишіть завдання — щонайменше ${REQUEST_MIN} символів`;
  if (len > REQUEST_MAX) return `Не довше ${REQUEST_MAX} символів`;
  return null;
}

/** Файлы к запросу: до 3 штук, JPG, PNG, HEIC или PDF, каждый до 10 МБ */
export const FILES_MAX = 3;
export const FILE_MAX_BYTES = 10 * 1024 * 1024;
const FILE_EXT = /\.(jpe?g|png|heic|heif|pdf)$/i;

export interface FileLike {
  name: string;
  size: number;
}

export function validateFiles(files: ArrayLike<FileLike>): string | null {
  const list = Array.from(files);
  if (list.length > FILES_MAX) return `Не більше ${FILES_MAX} файлів`;
  // Тип проверяем по расширению: HEIC с iPhone браузеры часто отдают с пустым MIME-типом
  const wrong = list.find((f) => !FILE_EXT.test(f.name));
  if (wrong) return `Файл «${wrong.name}» — потрібен JPG, PNG, HEIC або PDF`;
  const big = list.find((f) => f.size > FILE_MAX_BYTES);
  if (big) return `Файл «${big.name}» більший за 10 МБ`;
  return null;
}
