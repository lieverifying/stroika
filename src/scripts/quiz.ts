/**
 * Островок квиза (ARCHITECTURE.md 4.5–4.6): связывает разметку Quiz.astro с автоматом (machine.ts)
 * и хранилищем (storage.ts). Грузится, только когда квиз появился на экране (см. Quiz.astro).
 * — переход по нажатию варианта, без кнопки «Далі»;
 * — «Назад» и системная «назад» (history.pushState / popstate) листают шаги;
 * — ответы сохраняются (без имени и телефона); при новом показе квиз начинается с начала (шаг 1 или шаг 2 посадочной),
 *   а сохранённое прохождение возвращает кнопка «Продовжити, де зупинились»;
 * — на посадочной шаг 1 пропущен (правка 2026-10-21): /kukhni начинает с «Яка форма кухні?», /mebli — с типа шафы
 *   (data-preset у квиза или /?kvyz=shafa); «Назад» возвращает на шаг 1, на остальных страницах квиз — с шага 1;
 * — «Інше, нестандартне» не меняет состояние, а ведёт в блок «Нестандартне завдання» (#zapyt).
 */
import { facts } from '../content/facts';
import { quizStepEvents, track } from '../lib/analytics';
import { leadLanding } from '../lib/landing';
import { clearErrorsOnFix, validateForm } from '../lib/lead/field-errors';
import { saveThanks, toMethod } from '../lib/lead/result-store';
import { showSendError } from '../lib/lead/send-error';
import { submitLead } from '../lib/lead/submit';
import { leadSucceeded } from '../lib/tags';
import { normalizePhone } from '../lib/phone';
import { STEPS, branchOf } from '../lib/quiz/config';
import { computeResult, factsToPriceInput } from '../lib/quiz/price';
import { validateConsent, validateName, validatePhone } from '../lib/lead/validate';
import { answer, back, currentPath, isLastStep, progress, start } from '../lib/quiz/machine';
import { clearState, loadState, saveState } from '../lib/quiz/storage';
import type { QuizAnswers, QuizState, StepId } from '../lib/quiz/types';

/** Ответы квиза текстом для Telegram и таблицы: «Кухня · Кутова · 3–4 м · …» (подписи вариантов из config.ts) */
function answersSummary(answers: QuizAnswers): string {
  return currentPath(answers)
    .map((id) => {
      const value = answers[id as keyof QuizAnswers];
      const label = STEPS[id].options?.find((o) => o.value === value)?.label;
      return typeof label === 'string' ? label : '';
    })
    .filter(Boolean)
    .join(' · ');
}

/** Предвыбор ветки: data-preset квиза (посадочная) или адрес ?kvyz=shafa; ?kvyz=start — с шага 1 без предвыбора */
function presetFor(root: HTMLElement): Partial<QuizAnswers> | undefined {
  const v = new URLSearchParams(location.search).get('kvyz');
  if (v === 'shafa') return { goal: 'wardrobe' };
  if (v === 'start') return undefined;
  const p = root.dataset.preset;
  return p === 'kitchen' || p === 'wardrobe' ? { goal: p } : undefined;
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
  const preset = presetFor(root);
  // Начало: шаг 1, а на посадочной — сразу шаг 2 её ветки (ответ на шаг 1 подставлен).
  // Главная не открывается на шаге контакта: сохранённое прохождение предлагаем продолжить кнопкой.
  const fresh = (): QuizState => (preset?.goal ? answer(start(Date.now()), preset.goal, Date.now()) : start(Date.now()));
  let state: QuizState = fresh();
  // Шаг выбора пропущен (посадочная): нумерация без него — первый видимый шаг «Крок 1», кухня 5 шагов, шафа 4.
  // Вернулись «Назад» на шаг выбора — нумерация по полной ветке (кухня 6, шафа 5) до «Почати заново».
  let skippedGoal = state.stepId !== 'goal';
  const initial = { stepId: state.stepId, depth: state.history.length };
  const atStart = () => state.stepId === initial.stepId && state.history.length === initial.depth;
  const saved = loadState(Date.now());
  let resumable: QuizState | null = saved && saved.history.length > initial.depth ? saved : null;

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

    // «Крок N з M» — шаги текущей ветки (кухня 6, шафа 5, інші меблі 4); пока ветка не выбрана — просто «Крок 1»
    if (state.stepId === 'goal') skippedGoal = false;
    const p = progress(state);
    const n = skippedGoal ? p.current - 1 : p.current;
    const total = skippedGoal ? p.total - 1 : p.total;
    const label = branchOf(state.answers.goal) ? `Крок ${n} з ${total}` : `Крок ${n}`;
    if (bar) {
      bar.setAttribute('aria-valuenow', String(n));
      bar.setAttribute('aria-valuemax', String(total));
      bar.setAttribute('aria-valuetext', label);
      bar.querySelector<HTMLElement>('span')?.style.setProperty('--progress', `calc(${n} / ${total})`);
    }
    if (barText) barText.textContent = label;
    root.dataset.last = String(isLastStep(state));

    if (resumeBtn) resumeBtn.hidden = !(resumable && atStart());
    if (backBtn) backBtn.hidden = state.history.length === 0;
    // «Почати заново» — когда уже есть пройденные шаги (подставленный на посадочной шаг 1 не в счёт)
    if (restartBtn) restartBtn.hidden = atStart();

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
    // quizDepth — сколько шагов квиз сам положил в историю: «Назад» листает историю, только пока она есть
    history.pushState({ ...history.state, quizStep: state.stepId, quizDepth: (history.state?.quizDepth ?? 0) + 1 }, '');
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
    if (history.state?.quizStep === state.stepId && (history.state?.quizDepth ?? 0) > 0 && state.history.length) history.back();
    else {
      state = back(state, Date.now());
      persist();
      render(true);
    }
  });

  window.addEventListener('popstate', (e) => {
    const target = (e.state as { quizStep?: StepId } | null)?.quizStep ?? 'goal';
    // Первая запись истории на посадочной — уже шаг 2 (шаг 1 подставлен без записи): «назад» с неё — на шаг 1
    if (target === state.stepId && state.stepId === initial.stepId && state.history.length) {
      state = back(state, Date.now());
      persist();
      render(true);
      return;
    }
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
    state = fresh();
    skippedGoal = state.stepId !== 'goal';
    history.replaceState({ ...history.state, quizStep: state.stepId, quizDepth: 0 }, '');
    render(true);
  });

  // Шаг контакта: проверка полей (имя 2–50, телефон +380, согласие)
  const CONTACT_CHECKS = {
    name: (f: HTMLInputElement | HTMLTextAreaElement) => validateName(f.value),
    phone: (f: HTMLInputElement | HTMLTextAreaElement) => validatePhone(f.value),
    consent: (f: HTMLInputElement | HTMLTextAreaElement) => validateConsent((f as HTMLInputElement).checked),
  };
  root.querySelectorAll<HTMLFormElement>('form[data-quiz-form]').forEach((form) => {
    const checks = CONTACT_CHECKS;
    clearErrorsOnFix(form, checks);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(form, checks)) return;
      fireStepEvents(state.stepId); // шаг контакта пройден
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
    const landing = leadLanding();
    const res = await submitLead({
      contactMethod: method,
      form: 'quiz',
      landing, // страница-источник: kukhni или mebli
      name,
      phone: normalizePhone(String(data.get('phone') ?? '')),
      referrer: String(data.get('referrer') ?? '').trim(),
      consent: true,
      quiz: {
        answers: state.answers,
        result,
        summary: answersSummary(state.answers),
        branch: branchOf(state.answers.goal) ?? '',
        timing: STEPS.timing.options?.find((o) => o.value === state.answers.timing)?.label ?? '',
      },
      website: data.get('website') ?? '',
    });
    if (res.ok) {
      track('lead_submit', { form: 'quiz', landing });
      leadSucceeded('quiz');
      saveThanks({ name, method, result });
      clearState();
      location.assign('/dyakuyemo');
    } else {
      if (button) button.disabled = false;
      showSendError(status);
    }
  }

  history.replaceState({ ...history.state, quizStep: state.stepId, quizDepth: 0 }, '');
  root.classList.add('quiz--ready');
  render(false);
}
