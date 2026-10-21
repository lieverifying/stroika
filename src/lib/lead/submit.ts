/**
 * Отправка заявки в api/lead.php (ARCHITECTURE.md 7, фаза 6).
 * JSON, а с файлами («Нестандартне завдання») — multipart: поле payload + files[]. Таймаут 10 с,
 * при сбое сети или ответе 5xx — один повтор через 2 с. Пока facts.flags.leadSubmitEnabled выключен — заглушка без сети.
 */
import { facts } from '../../content/facts';
import { readAttribution } from './attribution';

export const LEAD_ENDPOINT = '/api/lead.php';

export interface SubmitResult {
  ok: boolean;
  leadId?: string;
}

interface Options {
  /** Задержка заглушки, мс */
  delayMs?: number;
  /** Пауза перед повтором, мс */
  retryDelayMs?: number;
  timeoutMs?: number;
  files?: File[];
  enabled?: boolean;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Когда открыта страница — от этого момента считаем, как быстро заполнили форму (боты быстрее 3 с) */
const startedAt = Date.now();

export async function submitLead(payload: Record<string, unknown>, opts: Options = {}): Promise<SubmitResult> {
  const enabled = opts.enabled ?? facts.flags.leadSubmitEnabled;
  if (!enabled) {
    await sleep(opts.delayMs ?? 600);
    return { ok: true };
  }
  const body = {
    ...payload,
    eventId: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    elapsedMs: Date.now() - startedAt,
    page: location.pathname,
    attribution: readAttribution(),
  };
  const attempt = async (): Promise<{ result: SubmitResult; retry: boolean }> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 10_000);
    try {
      let init: RequestInit;
      if (opts.files?.length) {
        const fd = new FormData();
        fd.append('payload', JSON.stringify(body));
        opts.files.forEach((f) => fd.append('files[]', f, f.name));
        init = { method: 'POST', body: fd, headers: { Accept: 'application/json' } };
      } else {
        init = { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };
      }
      const res = await fetch(LEAD_ENDPOINT, { ...init, signal: ctrl.signal });
      const data = (await res.json().catch(() => null)) as SubmitResult | null;
      if (res.ok && data?.ok) return { result: { ok: true, leadId: data.leadId }, retry: false };
      return { result: { ok: false }, retry: res.status >= 500 };
    } catch {
      return { result: { ok: false }, retry: true }; // сеть или таймаут
    } finally {
      clearTimeout(timer);
    }
  };
  // eventId тот же — сервер отсечёт дубль, если первая попытка всё же дошла
  const first = await attempt();
  if (first.result.ok || !first.retry) return first.result;
  await sleep(opts.retryDelayMs ?? 2000);
  return (await attempt()).result;
}
