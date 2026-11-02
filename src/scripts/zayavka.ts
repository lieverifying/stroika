/**
 * Шаги лендинга /zayavka. Виден один шаг; без JS — все поля подряд и обычный POST в api/lead.php.
 * Касание варианта на шаге с data-auto сразу ведёт дальше. С клавиатуры стрелки только меняют выбор, дальше — Enter.
 */
import { clearErrorsOnFix, setFieldError, validateForm } from '../lib/lead/field-errors';
import { saveThanks, toMethod } from '../lib/lead/result-store';
import { showSendError } from '../lib/lead/send-error';
import { submitLead } from '../lib/lead/submit';
import { validateBudget, validateConsent, validateFiles, validateName, validatePhone } from '../lib/lead/validate';
import { normalizePhone } from '../lib/phone';
import { leadSucceeded } from '../lib/tags';
import { track } from '../lib/track';

const ORDER = ['city', 'need', 'budget', 'project', 'material', 'contact'] as const;
type StepId = (typeof ORDER)[number];
type Field = HTMLInputElement | HTMLTextAreaElement;

/** Город — вход в форму, в счётчик не входит: «Крок 1 з 5» начинается с «Що потрібно?» */
const COUNTED = ORDER.length - 1;
const NO_PROJECT = 'Немає';
const CITY_OK = 'Черкаси';

const CONTACT_CHECKS = {
  name: (f: Field) => validateName(f.value),
  phone: (f: Field) => validatePhone(f.value),
  consent: (f: Field) => validateConsent((f as HTMLInputElement).checked),
};
const BUDGET_CHECKS = { budget: (f: Field) => validateBudget(f.value) };
const FILES_CHECKS = { files: (f: Field) => validateFiles((f as HTMLInputElement).files ?? []) };

function formatBudget(value: string): string {
  return value.replace(/\D/g, '').slice(0, 9).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

const form = document.querySelector<HTMLFormElement>('form[data-zayavka-form]');
if (form) {
  const stepEl = (id: StepId) => form.querySelector<HTMLElement>(`[data-step="${id}"]`)!;
  const progress = form.querySelector<HTMLElement>('[data-progress]')!;
  const stop = form.querySelector<HTMLElement>('[data-stop]')!;
  const nav = form.querySelector<HTMLElement>('[data-nav]')!;
  const nextBtn = form.querySelector<HTMLElement>('[data-next]')!;
  const unknownBtn = form.querySelector<HTMLElement>('[data-budget-unknown]')!;
  const projectFiles = form.querySelector<HTMLElement>('[data-project-files]')!;
  const filesInput = form.querySelector<HTMLInputElement>('input[name="files"]')!;
  const budgetInput = form.querySelector<HTMLInputElement>('input[name="budget"]')!;
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  let current: StepId = 'city';
  let byPointer = false;

  const choice = (name: string) => String(new FormData(form).get(name) ?? '');

  function focusTitle(root: HTMLElement) {
    root.querySelector<HTMLElement>('.z-step__title')?.focus({ preventScroll: true });
  }

  function show(id: StepId, focus = true) {
    current = id;
    stop.hidden = true;
    // На телефоне после входа заголовок сворачивается: шаг и кнопки остаются на первом экране
    form!.closest('.z')?.classList.toggle('is-started', id !== 'city');
    ORDER.forEach((s) => (stepEl(s).hidden = s !== id));
    const index = ORDER.indexOf(id);
    progress.hidden = index === 0;
    progress.textContent = `Крок ${index} з ${COUNTED}`;
    // «Назад» — везде, кроме входа; «Далі» — там, где касание варианта не ведёт дальше само; на контакте дальше — только отправка
    nav.hidden = index === 0;
    nextBtn.hidden = id === 'contact' || stepEl(id).hasAttribute('data-auto');
    if (focus) {
      form!.scrollIntoView({ block: 'nearest' });
      focusTitle(stepEl(id));
      track('zayavka_step', { step: index });
    }
  }

  function showStop() {
    ORDER.forEach((s) => (stepEl(s).hidden = true));
    progress.hidden = true;
    nav.hidden = true;
    stop.hidden = false;
    focusTitle(stop);
    track('zayavka_step', { step: 'other_city' });
  }

  /** Без выбора на шаге показываем ошибку; с Enter можно попасть сюда, не выбрав вариант */
  function stepValid(id: StepId): boolean {
    if (id === 'budget') return validateForm(form!, BUDGET_CHECKS);
    if (id === 'project' && !validateForm(form!, FILES_CHECKS)) return false;
    if (id === 'contact') return true;
    const error = stepEl(id).querySelector<HTMLElement>('[data-step-error]');
    const picked = choice(id) !== '';
    if (error) error.hidden = picked;
    return picked;
  }

  function goNext() {
    if (!stepValid(current)) return;
    if (current === 'city' && choice('city') !== CITY_OK) return showStop();
    const next = ORDER[ORDER.indexOf(current) + 1];
    if (next) show(next);
  }

  function syncProjectFiles() {
    const value = choice('project');
    projectFiles.hidden = value === '' || value === NO_PROJECT;
    if (value === NO_PROJECT && filesInput.value) {
      filesInput.value = '';
      filesInput.dispatchEvent(new Event('change'));
    }
  }

  unknownBtn.hidden = false;
  syncProjectFiles();
  show('city', false);
  clearErrorsOnFix(form, { ...BUDGET_CHECKS, ...FILES_CHECKS, ...CONTACT_CHECKS });

  budgetInput.addEventListener('input', () => {
    budgetInput.value = formatBudget(budgetInput.value);
  });
  filesInput.addEventListener('change', () => setFieldError(filesInput, FILES_CHECKS.files(filesInput)));

  // Стрелки на радиокнопках тоже дают click: идём дальше, только если был палец или мышь
  form.addEventListener('pointerdown', () => (byPointer = true));
  form.addEventListener('keydown', () => (byPointer = false));
  form.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-next]')) return goNext();
    if (target.closest('[data-back]')) return show(ORDER[Math.max(ORDER.indexOf(current) - 1, 0)]);
    if (target.closest('[data-stop-back]')) return show('city');
    if (target.closest('[data-budget-unknown]')) {
      budgetInput.value = '';
      setFieldError(budgetInput, null);
      return show('project');
    }
    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') return;
    const step = target.closest<HTMLElement>('[data-step]');
    if (!step) return;
    step.querySelector<HTMLElement>('[data-step-error]')?.setAttribute('hidden', '');
    if (step.dataset.step === 'project') {
      syncProjectFiles();
      if (byPointer && target.value === NO_PROJECT) goNext();
      return;
    }
    if (byPointer && step.hasAttribute('data-auto')) goNext();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (current !== 'contact') return goNext();
    if (!validateForm(form, CONTACT_CHECKS)) {
      if (status) status.textContent = '';
      return;
    }
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Надсилаємо…';
    const data = new FormData(form);
    const method = toMethod(data.get('method'));
    const name = String(data.get('name') ?? '').trim();
    const project = String(data.get('project') ?? '');
    // Способ связи — первым полем: в Telegram-сообщении он первой строкой (ARCHITECTURE.md 7)
    const res = await submitLead(
      {
        contactMethod: method,
        form: 'zayavka',
        landing: 'zayavka',
        city: String(data.get('city') ?? ''),
        need: String(data.get('need') ?? ''),
        budget: String(data.get('budget') ?? '').replace(/\D/g, ''),
        project,
        material: String(data.get('material') ?? ''),
        district: String(data.get('district') ?? '').trim(),
        name,
        phone: normalizePhone(String(data.get('phone') ?? '')),
        referrer: String(data.get('referrer') ?? '').trim(),
        consent: true,
        website: data.get('website') ?? '',
      },
      { files: project === NO_PROJECT ? [] : Array.from(filesInput.files ?? []) },
    );
    if (res.ok) {
      track('lead_submit', { form: 'zayavka', landing: 'zayavka' });
      // В Pixel и GA4 уходит только тип формы и страница: бюджет, имя и телефон не передаются
      leadSucceeded('zayavka', 'zayavka');
      saveThanks({ name, method, result: null });
      location.assign('/dyakuyemo');
    } else {
      if (button) button.disabled = false;
      showSendError(status);
    }
  });
}
