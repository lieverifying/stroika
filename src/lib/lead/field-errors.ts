/**
 * Показ ошибок у полей формы (общий для формы замера и квиза).
 * Ошибка: aria-invalid, видимый текст в #<id>-error и id ошибки в aria-describedby — только пока она показана.
 */
export function setFieldError(field: HTMLElement, message: string | null): void {
  const invalid = message !== null;
  field.setAttribute('aria-invalid', String(invalid));
  const errorId = `${field.id}-error`;
  const error = document.getElementById(errorId);
  if (error) {
    if (message) error.textContent = message;
    error.hidden = !invalid;
  }
  const ids = new Set((field.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean));
  if (invalid) ids.add(errorId);
  else ids.delete(errorId);
  if (ids.size) field.setAttribute('aria-describedby', [...ids].join(' '));
  else field.removeAttribute('aria-describedby');
}

type Validator = (field: HTMLInputElement | HTMLTextAreaElement) => string | null;

/**
 * Проверить поля формы по списку name → проверка. Показывает ошибки, фокусирует первое неверное поле.
 * Возвращает true, если всё верно. Ошибка снимается сразу, как только поле исправлено.
 */
export function validateForm(form: HTMLFormElement, checks: Record<string, Validator>): boolean {
  let first: HTMLElement | null = null;
  for (const [name, check] of Object.entries(checks)) {
    const field = form.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) continue;
    const message = check(field);
    setFieldError(field, message);
    if (message && !first) first = field;
  }
  if (first) first.focus();
  return first === null;
}

/** Снимать ошибку, как только пользователь исправил поле */
export function clearErrorsOnFix(form: HTMLFormElement, checks: Record<string, Validator>): void {
  const onChange = (e: Event) => {
    const field = e.target as HTMLInputElement;
    const check = checks[field.name];
    if (check && field.getAttribute('aria-invalid') === 'true' && check(field) === null) setFieldError(field, null);
  };
  form.addEventListener('input', onChange);
  form.addEventListener('change', onChange);
}
