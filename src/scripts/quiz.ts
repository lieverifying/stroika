/**
 * Островок квиза (ARCHITECTURE.md 4.5–4.6): связывает разметку Quiz.astro с автоматом (machine.ts)
 * и хранилищем (storage.ts). Грузится, только когда квиз появился на экране (см. Quiz.astro).
 * — переход по нажатию варианта, без кнопки «Далі»;
 * — «Назад» и системная «назад» (history.pushState / popstate) листают шаги;
 * — ответы сохраняются (без имени и телефона) и восстанавливаются после перезагрузки;
 * — /?kvyz=shafa#kvyz заранее выбирает ветку шафы.
 */
import { clearErrorsOnFix, validateForm } from '../lib/lead/field-errors';
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

  const preset = presetFromUrl();
  let state: QuizState = loadState(Date.now()) ?? start(Date.now(), preset);
  if (preset && !state.started && state.stepId === 'goal') state = start(Date.now(), preset);

  const persist = () => saveState(state);

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
    if (backBtn) backBtn.hidden = first;
    if (restartBtn) restartBtn.hidden = first && !state.answers.goal;

    if (focus && current) {
      current.querySelector<HTMLElement>('.quiz-step__title')?.focus({ preventScroll: true });
      const top = root.getBoundingClientRect().top;
      if (top < 0) root.scrollIntoView({ block: 'start' });
    }
  }

  function go(next: QuizState) {
    state = next;
    persist();
    history.pushState({ ...history.state, quizStep: state.stepId }, '');
    render(true);
  }

  // Нажатие на вариант — сразу следующий шаг
  root.addEventListener('click', (e) => {
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role="radio"][data-value]');
    if (!option || !root.contains(option)) return;
    go(answer(state, option.dataset.value ?? '', Date.now()));
  });

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

  restartBtn?.addEventListener('click', () => {
    clearState();
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
      if (short) {
        state = setTask(state, (form.elements.namedItem('task') as HTMLTextAreaElement).value, Date.now());
        persist();
      }
      onValidSubmit(form);
    });
  });

  // Заглушка до задачи 4.8 (отправка и /dyakuyemo)
  function onValidSubmit(form: HTMLFormElement) {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    if (status) status.textContent = 'Перевірку пройдено.';
  }

  history.replaceState({ ...history.state, quizStep: state.stepId }, '');
  root.classList.add('quiz--ready');
  render(false);
}
