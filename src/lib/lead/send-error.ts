/**
 * Экран ошибки отправки (ARCHITECTURE.md 7.1): текст и прямые кнопки связи. Данные формы не трогаем —
 * человек может нажать «Надіслати» ещё раз.
 */
import { contactLinks } from '../contacts';

export function showSendError(status: HTMLElement | null): void {
  if (!status) return;
  status.replaceChildren();
  const p = document.createElement('span');
  p.textContent = 'Не вдалося надіслати. Подзвоніть або напишіть нам: ';
  status.append(p);
  const links: [string, string][] = [
    ['Подзвонити', contactLinks.tel],
    ['Viber', contactLinks.viber],
    ['Telegram', contactLinks.telegram],
  ];
  links.forEach(([label, href], i) => {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.className = 'send-error__link';
    status.append(a);
    if (i < links.length - 1) status.append(document.createTextNode(' · '));
  });
  status.dataset.error = '';
}
