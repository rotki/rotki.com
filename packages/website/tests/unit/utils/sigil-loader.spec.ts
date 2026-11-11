import { beforeAll, describe, expect, it } from 'vitest';

type BeforeSend = (type: string, payload: Record<string, unknown> | undefined) => Record<string, unknown> | undefined;

describe('public/sigil-loader.js', () => {
  const origin = window.location.origin;
  let beforeSend: BeforeSend;

  beforeAll(async () => {
    await import('../../../public/sigil-loader.js');
    const hook: unknown = Reflect.get(window, 'sigilBeforeSend');
    if (typeof hook !== 'function')
      throw new TypeError('sigil-loader.js did not define window.sigilBeforeSend');
    beforeSend = (type, payload) => Reflect.apply(hook, undefined, [type, payload]);
  });

  it.each([
    ['an activation link', '/activate/MTIz/abc-def', '/activate'],
    ['a password reset link', '/password/reset/MTIz/abc-def?utm_source=mail', '/password/reset'],
    ['a Google sign-in callback', '/oauth/google?code=secret&state=xyz', '/oauth/google'],
    ['a Monerium callback with a hash', '/oauth/monerium#code=secret', '/oauth/monerium'],
    ['an ordinary page', '/checkout/pay?plan=3&utm_source=mail#top', '/checkout/pay?plan=3&utm_source=mail#top'],
    ['the password reset request page', '/password/reset', '/password/reset'],
    ['a path that only starts the same way', '/activated/MTIz', '/activated/MTIz'],
  ])('cleans %s in the page URL, the referrer and the landing path', (_, path, expected) => {
    const result = beforeSend('event', {
      url: `${origin}${path}`,
      referrer: path,
      name: 'activation_completed',
      data: { landing_path: path, plan_id: 3 },
    });

    expect(result).toEqual({
      url: `${origin}${expected}`,
      referrer: expected,
      name: 'activation_completed',
      data: { landing_path: expected, plan_id: 3 },
    });
  });

  it('leaves other sites, empty values and payloads without data alone', () => {
    const result = beforeSend('pageview', { url: `${origin}/`, referrer: 'https://example.com/activate/a/b' });
    expect(result).toEqual({ url: `${origin}/`, referrer: 'https://example.com/activate/a/b', data: undefined });

    expect(beforeSend('pageview', { url: '', referrer: '' })).toEqual({ url: '', referrer: '', data: undefined });
    expect(beforeSend('pageview', undefined)).toBeUndefined();
  });
});
