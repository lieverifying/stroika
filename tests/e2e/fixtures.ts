import { test as base, expect, type Request } from '@playwright/test';

/**
 * Общая фикстура e2e: приёмник заявок api/lead.php подменён (в preview-сервере Astro нет PHP).
 * leads — тела отправленных заявок (JSON или payload из multipart) по порядку; ответ — { ok: true }.
 * leadStatus — код ответа подмены (например, 502, чтобы проверить экран ошибки).
 */
export interface LeadMock {
  leads: Record<string, unknown>[];
  status: number;
}

function bodyOf(req: Request): Record<string, unknown> {
  const ct = req.headers()['content-type'] ?? '';
  if (ct.includes('application/json')) return req.postDataJSON() as Record<string, unknown>;
  const raw = req.postData() ?? '';
  const m = raw.match(/name="payload"\r\n\r\n([\s\S]*?)\r\n--/);
  const parsed = m ? (JSON.parse(m[1]) as Record<string, unknown>) : {};
  return { ...parsed, __files: [...raw.matchAll(/name="files\[\]"; filename="([^"]+)"/g)].map((x) => x[1]) };
}

export const test = base.extend<{ leadApi: LeadMock }>({
  leadApi: [
    async ({ page }, use) => {
      const mock: LeadMock = { leads: [], status: 200 };
      await page.route('**/api/lead.php', async (route) => {
        mock.leads.push(bodyOf(route.request()));
        const ok = mock.status < 400;
        await route.fulfill({ status: mock.status, json: ok ? { ok: true, leadId: 'e2e' } : { ok: false } });
      });
      await use(mock);
    },
    { auto: true },
  ],
});

export { expect };
export type { Page } from '@playwright/test';
