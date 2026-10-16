/**
 * Отправка заявки (ARCHITECTURE.md 7). Заглушка до фазы 6: имитирует задержку и отвечает ok.
 * Сеть не трогает: настоящий api/lead.php подключается в фазе 6, сигнатура останется той же.
 */
export async function submitLead(_payload: unknown, opts: { delayMs?: number } = {}): Promise<{ ok: true }> {
  const delayMs = opts.delayMs ?? 600;
  await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  return { ok: true };
}
