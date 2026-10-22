// Мост к GA4 и Meta Pixel: названия событий, параметры без личных данных
import { afterEach, describe, expect, test, vi } from 'vitest';
import { contactClicked, forwardToGa4, leadSucceeded, pageName } from '../../src/lib/tags';

afterEach(() => vi.unstubAllGlobals());

function stubs() {
  const gtag = vi.fn();
  const fbq = vi.fn();
  vi.stubGlobal('gtag', gtag);
  vi.stubGlobal('fbq', fbq);
  return { gtag, fbq };
}

describe('tags', () => {
  test('без gtag и fbq ничего не падает', () => {
    expect(() => {
      forwardToGa4('quiz_start', { quiz_branch: 'kitchen' });
      leadSucceeded('quiz', undefined, '/kukhni');
      contactClicked('tel:+380759914843', '/');
    }).not.toThrow();
  });
  test('quiz_step_N → quiz_step { step: N }; quiz_start; story_complete; остальное не уходит', () => {
    const { gtag } = stubs();
    forwardToGa4('quiz_start', { quiz_branch: 'wardrobe', quiz_variant: 'B' });
    forwardToGa4('quiz_step_3', { quiz_branch: 'wardrobe', step_id: 'wardrobeWidth' });
    forwardToGa4('story_complete', { story: 'kitchen' });
    forwardToGa4('lead_submit', { form: 'quiz' });
    expect(gtag.mock.calls).toEqual([
      ['event', 'quiz_start', { quiz_branch: 'wardrobe' }],
      ['event', 'quiz_step', { step: 3, quiz_branch: 'wardrobe' }],
      ['event', 'story_complete', { story: 'kitchen' }],
    ]);
  });
  test('generate_lead { form_type, page } и Lead { content_name }: явный или «форма_страница»', () => {
    const { gtag, fbq } = stubs();
    leadSucceeded('zapyt', undefined, '/kontakty.html');
    leadSucceeded('plan', 'planuvannya', '/planuvannya');
    leadSucceeded('quiz', undefined, '/');
    expect(gtag.mock.calls).toEqual([
      ['event', 'generate_lead', { form_type: 'zapyt', page: '/kontakty' }],
      ['event', 'generate_lead', { form_type: 'plan', page: '/planuvannya' }],
      ['event', 'generate_lead', { form_type: 'quiz', page: '/' }],
    ]);
    expect(fbq.mock.calls.map((c) => c[2].content_name)).toEqual(['zapyt_kontakty', 'planuvannya', 'quiz_home']);
  });
  test('клик: телефон, Viber, Telegram — события и Contact; обычная ссылка — ничего', () => {
    const { gtag, fbq } = stubs();
    contactClicked('tel:+380759914843', '/kukhni');
    contactClicked('viber://chat?number=%2B380759914843', '/kukhni');
    contactClicked('https://t.me/+380759914843', '/kukhni');
    contactClicked('/roboty', '/kukhni');
    expect(gtag.mock.calls.map((c) => [c[1], c[2]])).toEqual([
      ['click_phone', { page: '/kukhni' }],
      ['click_messenger', { messenger: 'viber', page: '/kukhni' }],
      ['click_messenger', { messenger: 'telegram', page: '/kukhni' }],
    ]);
    expect(fbq.mock.calls).toEqual([['track', 'Contact', undefined], ['track', 'Contact', undefined], ['track', 'Contact', undefined]]);
  });
  test('pageName', () => {
    expect(pageName('/')).toBe('/');
    expect(pageName('/mebli.html')).toBe('/mebli');
    expect(pageName('/kontakty/')).toBe('/kontakty');
  });
});
