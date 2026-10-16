// submitLead — заглушка до фазы 6: ждёт и отвечает ok, сеть не трогает
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { submitLead } from '../../src/lib/lead/submit';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('submitLead (заглушка)', () => {
  test('по умолчанию ждёт 600 мс и возвращает ok', async () => {
    let done = false;
    const p = submitLead({ any: 'thing' }).then((r) => {
      done = true;
      return r;
    });
    await vi.advanceTimersByTimeAsync(599);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
    await expect(p).resolves.toEqual({ ok: true });
  });
  test('учитывает delayMs, в том числе 0', async () => {
    const p = submitLead(null, { delayMs: 50 });
    await vi.advanceTimersByTimeAsync(50);
    await expect(p).resolves.toEqual({ ok: true });
    const p0 = submitLead(undefined, { delayMs: 0 });
    await vi.advanceTimersByTimeAsync(0);
    await expect(p0).resolves.toEqual({ ok: true });
  });
  test('не обращается к сети', async () => {
    const fetchSpy = vi.fn();
    const xhrSpy = vi.fn();
    const beaconSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubGlobal('XMLHttpRequest', xhrSpy);
    vi.stubGlobal('navigator', { sendBeacon: beaconSpy });
    const p = submitLead({ name: 'x', phone: '+380000000000' });
    await vi.advanceTimersByTimeAsync(600);
    await p;
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();
    expect(beaconSpy).not.toHaveBeenCalled();
  });
});
