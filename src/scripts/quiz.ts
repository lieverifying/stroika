/**
 * Островок квиза (ARCHITECTURE.md 4.5–4.6): связывает разметку Quiz.astro с автоматом (machine.ts)
 * и хранилищем (storage.ts). Грузится, только когда квиз появился на экране (см. Quiz.astro).
 * — переход по нажатию варианта, без кнопки «Далі»;
 * — «Назад» и системная «назад» (history.pushState / popstate) листают шаги;
 * — ответы сохраняются (без имени и телефона); при новом показе квиз всегда начинается с шага 1,
 *   а сохранённое прохождение возвращает кнопка «Продовжити, де зупинились»;
 * — /?kvyz=shafa#kvyz заранее выбирает ветку шафы;
 * — «Інше, нестандартне» не меняет состояние, а ведёт в блок «Нестандартне завдання» (#zapyt).
 */
import { facts } from '../content/facts';
import { quizStepEvents, track } from '../lib/analytics';
import { clearErrorsOnFix, validateForm } from '../lib/lead/field-errors';
import { saveThanks, toMethod } from '../lib/lead/result-store';
import { submitLead } from '../lib/lead/submit';
import { normalizePhone } from '../lib/phone';
import { branchOf } from '../lib/quiz/config';
import { computeResult, factsToPriceInput } from '../lib/quiz/price';
import { validateConsent, validateName, validatePhone, validateTask } from '../lib/lead/validate';
import { answer, back, isLastStep, progress, setTask, start } from '../lib/quiz/machine';
import { clearState, loadState, saveState } from '../lib/quiz/storage';
import type { QuizAnswers, QuizState, StepId } from '../lib/quiz/types';

/** Предвыбор ветки из адреса: /?kvyz=shafa */
function presetFromUrl(): Partial<QuizAnswers> | undefined {
  const v = new URLSearchParams(location.search).get('kvyz');
  return v === 'shafa' ? { goal: 'wardrobe' } : undefined;
}

export function initQuiz(root: HTMLElement): void {
  if (root.dataset.ready) return;
  root.dataset.ready = '';

  const steps = new Map<StepId, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-step]').forEach((el) => steps.set(el.dataset.step as StepId, el));
  const bar = root.querySelector<HTMLElement>('[data-quiz-progress]');
  const barText = root.querySelector<HTMLElement>('[data-quiz-progress-text]');
  const backBtn = root.querySelector<HTMLButtonElement>('[data-quiz-back]');
  const restartBtn = root.querySelector<HTMLButtonElement>('[data-quiz-restart]');

  const resumeBtn = root.querySelector<HTMLButtonElement>('[data-quiz-resume]');
  const preset = presetFromUrl();
  // Всегда начинаем с шага 1: главная не должна открываться сразу на шаге контакта.
  // Сохранённое прохождение (дальше шага 1) предлагаем продолжить кнопкой.
  const saved = loadState(Date.now());
  let resumable: QuizState | null = saved && saved.history.length > 0 ? saved : null;
  let state: QuizState = start(Date.now(), preset);

  const persist = () => saveState(state);

  // quiz_start и quiz_step_N в dataLayer — без повторов (started / firedSteps в состоянии), без имени и телефона
  function fireStepEvents(completed: StepId) {
    const branch = branchOf(state.answers.goal);
    if (!branch) return;
    const res = quizStepEvents(state, completed, branch);
    state = res.state;
    res.events.forEach((ev) => track(ev.name, ev.params));
  }

  function render(focus: boolean) {
    for (const [id, el] of steps) el.hidden = id !== state.stepId;
    const current = steps.get(state.stepId);

    // Выбранный ранее ответ подсвечен, на нём же «перемещаемый» фокус
    const chosen = state.answers[state.stepId as keyof QuizAnswers];
    const options = current ? [...current.querySelectorAll<HTMLElement>('[role="radio"]')] : [];
    options.forEach((o) => o.setAttribute('aria-checked', String(o.dataset.value === chosen)));
    const tabStop = options.find((o) => o.dataset.value === chosen) ?? options[0];
    options.forEach((o) => (o.tabIndex = o === tabStop ? 0 : -1));

    const { current: n, total } = progress(state);
    if (bar) {
      bar.setAttribute('aria-valuenow', String(n));
      bar.setAttribute('aria-valuemax', String(total));
      bar.setAttribute('aria-valuetext', `Крок ${n} з ${total}`);
      bar.querySelector<HTMLElement>('span')?.style.setProperty('--progress', `calc(${n} / ${total})`);
    }
    if (barText) barText.textContent = `Крок ${n} з ${total}`;
    root.dataset.last = String(isLastStep(state));

    const first = state.stepId === 'goal';
    if (resumeBtn) resumeBtn.hidden = !(resumable && first);
    if (backBtn) backBtn.hidden = first;
    if (restartBtn) restartBtn.hidden = first && !state.answers.goal;

    if (focus && current) {
      current.querySelector<HTMLElement>('.quiz-step__title')?.focus({ preventScroll: true });
      const top = root.getBoundingClientRect().top;
      if (top < 0) root.scrollIntoView({ block: 'start' });
    }
  }

  function go(next: QuizState) {
    resumable = null; // начали заново — старое прохождение больше не предлагаем
    state = next;
    persist();
    history.pushState({ ...history.state, quizStep: state.stepId }, '');
    render(true);
  }

  // Нажатие на вариант — сразу следующий шаг
  root.addEventListener('click', (e) => {
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role="radio"][data-value]');
    if (!option || !root.contains(option)) return;
    if (option.dataset.href) {
      goToAnchor(option.dataset.href);
      return;
    }
    const completed = state.stepId;
    state = answer(state, option.dataset.value ?? '', Date.now());
    fireStepEvents(completed);
    go(state);
  });

  // Переход к блоку на странице (шапку учитывает scroll-padding-top у html) и фокус на первое поле
  function goToAnchor(href: string) {
    // Блок на другой странице (например, /kontakty#zapyt) — обычный переход
    const target = href.startsWith('#') ? document.querySelector<HTMLElement>(href) : null;
    if (!target) return void location.assign(href);
    history.pushState(history.state, '', href);
    target.scrollIntoView({ block: 'start' });
    target.querySelector<HTMLElement>('textarea, input:not([type="hidden"])')?.focus({ preventScroll: true });
  }

  // Стрелки двигают фокус внутри группы вариантов, Home / End — к краям; выбор — Enter или пробел
  root.addEventListener('keydown', (e) => {
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role="radio"]');
    const group = option?.parentElement;
    if (!option || !group) return;
    const all = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
    const i = all.indexOf(option);
    const to =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? all[(i + 1) % all.length]
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? all[(i - 1 + all.length) % all.length]
          : e.key === 'Home'
            ? all[0]
            : e.key === 'End'
              ? all[all.length - 1]
              : null;
    if (!to) return;
    e.preventDefault();
    all.forEach((o) => (o.tabIndex = o === to ? 0 : -1));
    to.focus();
  });

  // «Назад» в квизе = шаг истории браузера, чтобы и системная кнопка «назад» вела себя так же
  backBtn?.addEventListener('click', () => {
    if (history.state?.quizStep === state.stepId && state.history.length) history.back();
    else {
      state = back(state, Date.now());
      persist();
      render(true);
    }
  });

  window.addEventListener('popstate', (e) => {
    const target = (e.state as { quizStep?: StepId } | null)?.quizStep ?? 'goal';
    if (target === state.stepId || !state.history.includes(target)) return;
    while (state.stepId !== target && state.history.length) state = back(state, Date.now());
    persist();
    render(true);
  });

  resumeBtn?.addEventListener('click', () => {
    if (!resumable) return;
    const next = resumable;
    go(next);
  });

  restartBtn?.addEventListener('click', () => {
    clearState();
    resumable = null;
    state = start(Date.now());
    history.replaceState({ ...history.state, quizStep: 'goal' }, '');
    render(true);
  });

  // Шаг 7 и коротка форма: проверка полей (имя 2–50, телефон +380, согласие; задача — для короткой формы)
  const CONTACT_CHECKS = {
    name: (f: HTMLInputElement | HTMLTextAreaElement) => validateName(f.value),
    phone: (f: HTMLInputElement | HTMLTextAreaElement) => validatePhone(f.value),
    consent: (f: HTMLInputElement | HTMLTextAreaElement) => validateConsent((f as HTMLInputElement).checked),
  };
  root.querySelectorAll<HTMLFormElement>('form[data-quiz-form]').forEach((form) => {
    const short = form.dataset.quizForm === 'short';
    const checks = short ? { task: (f: HTMLInputElement | HTMLTextAreaElement) => validateTask(f.value), ...CONTACT_CHECKS } : CONTACT_CHECKS;
    clearErrorsOnFix(form, checks);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form, checks)) return;
      if (short) state = setTask(state, (form.elements.namedItem('task') as HTMLTextAreaElement).value, Date.now());
      fireStepEvents(state.stepId); // шаг 7 (контакт / коротка форма) пройден
      persist();
      onValidSubmit(form);
    });
  });

  // Отправка (заглушка до фазы 6, сеть не трогает) → результат в sessionStorage → очистка квиза → /dyakuyemo
  async function onValidSubmit(form: HTMLFormElement) {
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    if (button) button.disabled = true;
    if (status) status.textContent = 'Надсилаємо…';
    const data = new FormData(form);
    const result = computeResult(state.answers, factsToPriceInput(facts));
    const method = toMethod(data.get('method'));
    const name = String(data.get('name') ?? '').trim();
    // Способ связи — первым полем: в Telegram-сообщении он первой строкой (ARCHITECTURE.md 7)
    const res = await submitLead({
      contactMethod: method,
      form: 'quiz',
      name,
      phone: normalizePhone(String(data.get('phone') ?? '')),
      referrer: String(data.get('referrer') ?? '').trim(),
      consent: true,
      quiz: { answers: state.answers, result },
      website: data.get('website') ?? '',
    });
    if (res.ok) {
      saveThanks({ name, method, result });
      clearState();
      location.assign('/dyakuyemo');
    }
  }

  history.replaceState({ ...history.state, quizStep: state.stepId }, '');
  root.classList.add('quiz--ready');
  render(false);
}
