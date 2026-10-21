/**
 * Портфолио: фильтр по категориям, просмотр на весь экран, автозапуск видео в видимой области.
 * — Фильтр: кнопки [data-filter] внутри [data-gallery]; на /roboty категория в адресе (#kuhni).
 * — Просмотр: фото текущего фильтра этой галереи; стрелки, свайп, Esc, тап вне фото.
 * — Видео: без звука, play() только когда видно хотя бы наполовину; при prefers-reduced-motion — без автозапуска.
 */
export function initPortfolio(): void {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  if (!dialog || dialog.dataset.ready) return;
  dialog.dataset.ready = '';

  const img = dialog.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lb-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lb-count]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  let list: HTMLButtonElement[] = [];
  let index = 0;

  const show = (i: number) => {
    index = (i + list.length) % list.length;
    const b = list[index];
    const thumb = b.querySelector('img')!;
    img.src = b.dataset.full!;
    img.width = Number(b.dataset.w);
    img.height = Number(b.dataset.h);
    img.alt = thumb.alt;
    caption.textContent = thumb.alt;
    count.textContent = `${index + 1} / ${list.length}`;
    prev.hidden = next.hidden = list.length < 2;
    // Соседнее фото — заранее в кэш, чтобы листание было без паузы
    const n = list[(index + 1) % list.length];
    if (n) new Image().src = n.dataset.full!;
  };

  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.pf__open');
    if (!b) return;
    const gallery = b.closest('[data-gallery]') ?? document;
    list = [...gallery.querySelectorAll<HTMLButtonElement>('.pf__item:not([hidden]) .pf__open')];
    show(list.indexOf(b));
    dialog.showModal();
  });

  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dialog.querySelector('[data-lb-close]')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'ArrowLeft') show(index - 1);
  });
  // Тап вне фото (по фону или полю вокруг) закрывает
  let swiped = false;
  dialog.addEventListener('click', (e) => {
    if (swiped) return void (swiped = false);
    const t = e.target as HTMLElement;
    if (t === dialog || t.matches('[data-lb-stage]')) dialog.close();
  });
  // Свайп влево / вправо
  let x0: number | null = null;
  dialog.addEventListener('pointerdown', (e) => (x0 = e.clientX));
  dialog.addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50 && list.length > 1) {
      swiped = true;
      show(index + (dx < 0 ? 1 : -1));
    }
  });
  dialog.addEventListener('close', () => img.removeAttribute('src'));

  // Фильтр по категориям
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((gallery) => {
    const tabs = [...gallery.querySelectorAll<HTMLButtonElement>('[data-filter]')];
    if (!tabs.length) return;
    const items = [...gallery.querySelectorAll<HTMLElement>('.pf__item')];
    const apply = (cat: string) => {
      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.filter === cat)));
      items.forEach((it) => (it.hidden = cat !== 'all' && it.dataset.category !== cat));
      gallery.querySelectorAll<HTMLVideoElement>('.pf__item[hidden] video').forEach((v) => v.pause());
    };
    tabs.forEach((t) =>
      t.addEventListener('click', () => {
        apply(t.dataset.filter!);
        history.replaceState(history.state, '', t.dataset.filter === 'all' ? location.pathname : `#${t.dataset.filter}`);
      }),
    );
    // Категория из адреса (#kuhni) — при загрузке и при переходе по ссылке на той же странице
    const fromHash = () => {
      const cat = location.hash.slice(1);
      if (tabs.some((t) => t.dataset.filter === cat)) apply(cat);
    };
    fromHash();
    addEventListener('hashchange', fromHash);
  });

  // Видео: автозапуск без звука в видимой области
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) v.play().catch(() => {});
        else v.pause();
      }),
    { threshold: 0.5 },
  );
  document.querySelectorAll<HTMLVideoElement>('[data-pf-video]').forEach((v) => io.observe(v));
}
