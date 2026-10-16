/**
 * Правило «один жёлтый элемент на экран» (ARCHITECTURE.md 6.9).
 * Кнопки заявки помечены data-cta="primary" и data-cta-priority (hero/квиз/форма — 3, панель — 2, шапка — 1).
 * Из видимых хотя бы на 50 % жёлтой остаётся одна — с наибольшим приоритетом (при равенстве — первая в документе),
 * ей ставится data-cta-on. Остальные выглядят как secondary (CSS в global.css, по html[data-cta-ready]).
 * Без JS: кнопки hero — жёлтые, шапка и панель — графитовые (deferPrimary в Button.astro).
 * Логотип в правило не входит (решение владельца, ревью фазы 2): это <img>, а не data-cta.
 */
export function initCtaArbiter(root: Document = document): void {
  const ratios = new Map<HTMLElement, number>();
  let current: HTMLElement | null = null;

  const pick = () => {
    let best: HTMLElement | null = null;
    let bestPriority = -Infinity;
    for (const [el, ratio] of ratios) {
      if (ratio < 0.5 || !el.isConnected) continue;
      const priority = Number(el.dataset.ctaPriority ?? 0);
      // при равном приоритете побеждает та, что раньше в документе
      const earlier = best && el.compareDocumentPosition(best) & Node.DOCUMENT_POSITION_FOLLOWING;
      if (priority > bestPriority || (priority === bestPriority && earlier)) {
        best = el;
        bestPriority = priority;
      }
    }
    if (best === current) return;
    current?.removeAttribute('data-cta-on');
    best?.setAttribute('data-cta-on', '');
    current = best;
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) ratios.set(e.target as HTMLElement, e.isIntersecting ? e.intersectionRatio : 0);
      pick();
    },
    { threshold: [0, 0.5, 1] },
  );

  root.querySelectorAll<HTMLElement>('[data-cta="primary"]').forEach((el) => {
    ratios.set(el, 0);
    io.observe(el);
  });
  root.documentElement.setAttribute('data-cta-ready', '');
}
