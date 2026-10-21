// submitLead (фаза 6): отправка в api/lead.php, повтор при сбое, заглушка при выключенном флаге; источник заявки
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { captureAttribution, readAttribution } from '../../src/lib/lead/attribution';
import { LEAD_ENDPOINT, submitLead } from '../../src/lib/lead/submit';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('location', { pathname: '/kukhni' });
  vi.stubGlobal('sessionStorage', memory());
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const json = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body });

describe('submitLead: флаг выключен — заглушка', () => {
  test('ждёт 600 мс, отвечает ok, сеть не трогает', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const p = submitLead({ name: 'x' }, { enabled: false });
    await vi.advanceTimersByTimeAsync(600);
    await expect(p).resolves.toEqual({ ok: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('submitLead: отправка', () => {
  test('POST JSON на /api/lead.php: поля формы + eventId, elapsedMs, page, attribution', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(json(200, { ok: true, leadId: 'L1' }));
    vi.stubGlobal('fetch', fetchSpy);
    await expect(submitLead({ form: 'quiz', name: 'Олена' }, { enabled: true })).resolves.toEqual({ ok: true, leadId: 'L1' });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe(LEAD_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ form: 'quiz', name: 'Олена', page: '/kukhni', attribution: {} });
    expect(body.eventId).toMatch(/.{8,}/);
    expect(typeof body.elapsedMs).toBe('number');
  });

  test('5xx → один повтор через 2 с с тем же eventId', async () => {
    const fetchSpy = vi.fn().mockResolvedValueOnce(json(502, { ok: false })).mockResolvedValueOnce(json(200, { ok: true, leadId: 'L2' }));
    vi.stubGlobal('fetch', fetchSpy);
    const p = submitLead({ form: 'quiz' }, { enabled: true });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(p).resolves.toEqual({ ok: true, leadId: 'L2' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const ids = fetchSpy.mock.calls.map(([, init]) => JSON.parse(init.body).eventId);
    expect(ids[0]).toBe(ids[1]);
  });

  test('сбой сети дважды → ok: false', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new TypeError('network'));
    vi.stubGlobal('fetch', fetchSpy);
    const p = submitLead({}, { enabled: true });
    await vi.advanceTimersByTimeAsync(2000);
    await expect(p).resolves.toEqual({ ok: false });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  test('422 (неверные поля) — без повтора', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(json(422, { ok: false }));
    vi.stubGlobal('fetch', fetchSpy);
    await expect(submitLead({}, { enabled: true })).resolves.toEqual({ ok: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('с файлами — multipart: payload + files[]', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(json(200, { ok: true }));
    vi.stubGlobal('fetch', fetchSpy);
    const file = new File(['x'], 'plan.pdf', { type: 'application/pdf' });
    await submitLead({ form: 'zapyt' }, { enabled: true, files: [file] });
    const fd = fetchSpy.mock.calls[0][1].body as FormData;
    expect(JSON.parse(String(fd.get('payload'))).form).toBe('zapyt');
    expect((fd.getAll('files[]')[0] as File).name).toBe('plan.pdf');
  });
});

describe('источник заявки', () => {
  test('utm из адреса сохраняются вместе с первой страницей и внешним referrer', () => {
    const s = memory();
    captureAttribution(new URL('https://vymir.ua/kukhni?utm_source=instagram&utm_campaign=oct&x=1'), 'https://l.instagram.com/', s);
    expect(readAttribution(s)).toEqual({ utm_source: 'instagram', utm_campaign: 'oct', referrer: 'https://l.instagram.com/', landingPage: '/kukhni' });
  });
  test('переход по своему сайту не стирает источник', () => {
    const s = memory();
    captureAttribution(new URL('https://vymir.ua/?utm_source=google'), '', s);
    captureAttribution(new URL('https://vymir.ua/kontakty'), 'https://vymir.ua/', s);
    expect(readAttribution(s)).toMatchObject({ utm_source: 'google', landingPage: '/' });
  });
});
