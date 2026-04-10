import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTrackedEventData,
  type CamelToSnakeCase,
  classifyCryptoTxError,
  createTrackingSession,
  monthsToPlanDuration,
  parseQueryParam,
  parseUtmFromQuery,
  PAYMENT_LOG_ENDPOINT,
  PaymentFailures,
  PaymentServerEvents,
  postPaymentLog,
  reasonForServerEvent,
  type SigilEventPayloadMap,
  SigilEvents,
  type SnakeCaseKeys,
  toSnakeCaseKeys,
  type TrackingSession,
} from './index';

describe('monthsToPlanDuration', () => {
  it('returns monthly for a 1-month plan', () => {
    expect(monthsToPlanDuration(1)).toBe('monthly');
  });

  it('returns yearly for a 12-month plan', () => {
    expect(monthsToPlanDuration(12)).toBe('yearly');
  });

  it('returns yearly for any non-1 month count', () => {
    expect(monthsToPlanDuration(3)).toBe('yearly');
    expect(monthsToPlanDuration(6)).toBe('yearly');
    expect(monthsToPlanDuration(24)).toBe('yearly');
  });

  it('returns yearly for an unknown duration', () => {
    expect(monthsToPlanDuration(undefined)).toBe('yearly');
  });
});

describe('payment failure catalog', () => {
  it('derives server event strings that match the catalog entries', () => {
    for (const [key, entry] of Object.entries(PaymentFailures)) {
      expect(PaymentServerEvents[key as keyof typeof PaymentFailures]).toBe(entry.serverEvent);
    }
  });

  it('round-trips server event → reason for every entry', () => {
    for (const entry of Object.values(PaymentFailures)) {
      expect(reasonForServerEvent(entry.serverEvent)).toBe(entry.reason);
    }
  });

  it('uses unique server event strings', () => {
    const events = Object.values(PaymentFailures).map(e => e.serverEvent);
    expect(new Set(events).size).toBe(events.length);
  });
});

describe('classifyCryptoTxError', () => {
  it('detects user rejection by ethers code', () => {
    expect(classifyCryptoTxError({ code: 'ACTION_REJECTED' })).toBe('CRYPTO_USER_REJECTED');
  });

  it('detects user rejection by EIP-1193 numeric code', () => {
    expect(classifyCryptoTxError({ code: 4001 })).toBe('CRYPTO_USER_REJECTED');
  });

  it('detects user rejection by message substring', () => {
    expect(classifyCryptoTxError({ message: 'MetaMask Tx Signature: User denied transaction signature.' })).toBe('CRYPTO_USER_REJECTED');
  });

  it('detects insufficient funds by ethers code', () => {
    expect(classifyCryptoTxError({ code: 'INSUFFICIENT_FUNDS' })).toBe('CRYPTO_INSUFFICIENT_FUNDS');
  });

  it('detects insufficient funds from ERC20 revert message', () => {
    expect(classifyCryptoTxError({ shortMessage: 'execution reverted: ERC20: transfer amount exceeds balance' })).toBe('CRYPTO_INSUFFICIENT_FUNDS');
  });

  it('falls back to generic tx failure for unknown errors', () => {
    expect(classifyCryptoTxError({ message: 'nonce too low' })).toBe('CRYPTO_TX_FAILED');
  });

  it('handles null/undefined safely', () => {
    expect(classifyCryptoTxError(undefined)).toBe('CRYPTO_TX_FAILED');
    expect(classifyCryptoTxError(null)).toBe('CRYPTO_TX_FAILED');
  });
});

describe('parseQueryParam', () => {
  it('returns the value for plain strings', () => {
    expect(parseQueryParam('twitter')).toBe('twitter');
  });

  it('returns the first element for arrays', () => {
    expect(parseQueryParam(['twitter', 'facebook'])).toBe('twitter');
  });

  it('returns undefined for empty arrays', () => {
    expect(parseQueryParam([])).toBeUndefined();
  });

  it('returns undefined for null/undefined', () => {
    expect(parseQueryParam(null)).toBeUndefined();
    expect(parseQueryParam(undefined)).toBeUndefined();
  });

  it('returns undefined for non-string scalars', () => {
    expect(parseQueryParam(42)).toBeUndefined();
    expect(parseQueryParam(true)).toBeUndefined();
  });

  it('skips null entries at the front of an array', () => {
    // Vue Router arrays can contain null entries; the current behaviour is to
    // return undefined when the first slot is null rather than scanning.
    expect(parseQueryParam([null, 'fallback'])).toBeUndefined();
  });
});

describe('parseUtmFromQuery', () => {
  it('extracts all five utm_ fields', () => {
    const result = parseUtmFromQuery({
      utm_source: 'twitter',
      utm_medium: 'social',
      utm_campaign: 'spring2026',
      utm_content: 'banner-top',
      utm_term: 'rotki',
    });

    expect(result).toEqual({
      utmSource: 'twitter',
      utmMedium: 'social',
      utmCampaign: 'spring2026',
      utmContent: 'banner-top',
      utmTerm: 'rotki',
    });
  });

  it('leaves missing fields undefined', () => {
    const result = parseUtmFromQuery({ utm_source: 'twitter' });
    expect(result.utmSource).toBe('twitter');
    expect(result.utmMedium).toBeUndefined();
    expect(result.utmCampaign).toBeUndefined();
  });

  it('ignores unrelated query keys', () => {
    const result = parseUtmFromQuery({
      utm_source: 'twitter',
      planId: '42',
      ref: 'foo',
    });
    expect(result.utmSource).toBe('twitter');
    expect(Object.keys(result)).toEqual([
      'utmSource',
      'utmMedium',
      'utmCampaign',
      'utmContent',
      'utmTerm',
    ]);
  });

  it('handles array-valued query parameters', () => {
    const result = parseUtmFromQuery({ utm_source: ['twitter', 'facebook'] });
    expect(result.utmSource).toBe('twitter');
  });
});

describe('createTrackingSession', () => {
  it('generates a v4-looking session id', () => {
    const session = createTrackingSession({ landingPath: '/' });
    // crypto.randomUUID() returns RFC 4122 v4 UUIDs
    expect(session.sessionId).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i);
  });

  it('generates a unique session id on each call', () => {
    const a = createTrackingSession({ landingPath: '/' });
    const b = createTrackingSession({ landingPath: '/' });
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it('stamps capturedAt with an ISO timestamp', () => {
    const before = Date.now();
    const session = createTrackingSession({ landingPath: '/' });
    const after = Date.now();
    const ts = Date.parse(session.utm.capturedAt!);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('carries UTM fields through to the session', () => {
    const session = createTrackingSession({
      utm: { utmSource: 'twitter', utmCampaign: 'spring2026' },
      landingPath: '/checkout/pay',
    });
    expect(session.utm.utmSource).toBe('twitter');
    expect(session.utm.utmCampaign).toBe('spring2026');
    expect(session.utm.landingPath).toBe('/checkout/pay');
  });

  it('coerces empty referrer strings to undefined', () => {
    const session = createTrackingSession({
      referrer: '',
      landingPath: '/',
    });
    expect(session.utm.referrer).toBeUndefined();
  });

  it('keeps non-empty referrer', () => {
    const session = createTrackingSession({
      referrer: 'https://example.com/',
      landingPath: '/',
    });
    expect(session.utm.referrer).toBe('https://example.com/');
  });
});

describe('buildTrackedEventData', () => {
  const session: TrackingSession = {
    sessionId: 'sess-abc',
    utm: {
      utmSource: 'twitter',
      utmMedium: 'social',
      utmCampaign: 'spring2026',
      utmContent: 'banner',
      utmTerm: 'rotki',
      referrer: 'https://x.com/',
      landingPath: '/',
      capturedAt: '2026-04-10T00:00:00.000Z',
    },
  };

  it('merges event data with all attribution fields', () => {
    const result = buildTrackedEventData({ plan_id: 42 }, session);
    expect(result).toEqual({
      plan_id: 42,
      session_id: 'sess-abc',
      utm_source: 'twitter',
      utm_medium: 'social',
      utm_campaign: 'spring2026',
      utm_content: 'banner',
      utm_term: 'rotki',
      referrer: 'https://x.com/',
      landing_path: '/',
    });
  });

  it('leaves attribution fields undefined when no session is provided', () => {
    const result = buildTrackedEventData({ plan_id: 42 }, undefined);
    expect(result.plan_id).toBe(42);
    expect(result.session_id).toBeUndefined();
    expect(result.utm_source).toBeUndefined();
  });

  it('does not mutate the input data object', () => {
    const input = { plan_id: 42 };
    buildTrackedEventData(input, session);
    expect(input).toEqual({ plan_id: 42 });
  });

  it('lets session attribution win over a conflicting event data field', () => {
    // Not a supported scenario but documents the merge order.
    const result = buildTrackedEventData({ session_id: 'override' }, session);
    expect(result.session_id).toBe('sess-abc');
  });
});

describe('postPaymentLog', () => {
  const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to the payment log endpoint with snake_case keys', () => {
    postPaymentLog({
      paymentMethod: 'card',
      event: 'card_payment_api_error',
      errorMessage: 'oops',
      planId: 42,
      isUpgrade: false,
      step: 'submit',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(PAYMENT_LOG_ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.keepalive).toBe(true);

    // Verify the body is sent with snake_case keys
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.payment_method).toBe('card');
    expect(body.error_message).toBe('oops');
    expect(body.plan_id).toBe(42);
    expect(body.is_upgrade).toBe(false);
  });

  it('adds a timestamp to the payload', () => {
    const before = Date.now();
    postPaymentLog({
      paymentMethod: 'paypal',
      event: 'paypal_submit_error',
      errorMessage: 'oops',
      isUpgrade: true,
    });
    const after = Date.now();

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { timestamp: number; payment_method: string; event: string };
    expect(body.timestamp).toBeGreaterThanOrEqual(before);
    expect(body.timestamp).toBeLessThanOrEqual(after);
    expect(body.payment_method).toBe('paypal');
    expect(body.event).toBe('paypal_submit_error');
  });

  it('swallows fetch rejections', async () => {
    fetchMock.mockImplementationOnce(async () => {
      throw new Error('network');
    });
    expect(() => postPaymentLog({
      paymentMethod: 'crypto',
      event: 'crypto_tx_failed',
      errorMessage: 'oops',
      isUpgrade: false,
    })).not.toThrow();
    // Yield so the rejected promise's catch handler runs.
    await Promise.resolve();
  });
});

describe('toSnakeCaseKeys', () => {
  it('converts simple camelCase keys to snake_case', () => {
    const result = toSnakeCaseKeys({
      paymentMethod: 'card',
      planId: 42,
      isUpgrade: true,
    });

    expect(result).toEqual({
      payment_method: 'card',
      plan_id: 42,
      is_upgrade: true,
    });
  });

  it('leaves already snake_case or flat keys unchanged', () => {
    const result = toSnakeCaseKeys({
      currency: 'EUR',
      reason: 'test',
      step: 'init',
    });

    expect(result).toEqual({
      currency: 'EUR',
      reason: 'test',
      step: 'init',
    });
  });

  it('handles multi-word camelCase keys', () => {
    const result = toSnakeCaseKeys({
      planDuration: 'yearly',
      fromPlanName: 'Basic',
      toPlanDuration: 'monthly',
      discountApplied: true,
      errorMessage: 'oops',
      errorCode: '500',
    });

    expect(result).toEqual({
      plan_duration: 'yearly',
      from_plan_name: 'Basic',
      to_plan_duration: 'monthly',
      discount_applied: true,
      error_message: 'oops',
      error_code: '500',
    });
  });

  it('preserves undefined values', () => {
    const result = toSnakeCaseKeys({
      paymentMethod: 'card',
      cardType: undefined,
    });

    expect(result).toEqual({
      payment_method: 'card',
      card_type: undefined,
    });
  });

  it('does not mutate the input', () => {
    const input = { planId: 42, isUpgrade: false };
    toSnakeCaseKeys(input);
    expect(input).toEqual({ planId: 42, isUpgrade: false });
  });

  it('produces correct types at compile time', () => {
    // These type assertions verify the CamelToSnakeCase utility type works correctly.
    const checkPaymentMethod: CamelToSnakeCase<'paymentMethod'> = 'payment_method';
    const checkPlanId: CamelToSnakeCase<'planId'> = 'plan_id';
    const checkIsUpgrade: CamelToSnakeCase<'isUpgrade'> = 'is_upgrade';
    const checkCurrency: CamelToSnakeCase<'currency'> = 'currency';
    const checkFromPlanName: CamelToSnakeCase<'fromPlanName'> = 'from_plan_name';

    // Mapped type check
    interface Input { paymentMethod: string; planId: number; isUpgrade: boolean }
    const mapped: SnakeCaseKeys<Input> = {
      payment_method: 'card',
      plan_id: 42,
      is_upgrade: true,
    };

    expect(checkPaymentMethod).toBe('payment_method');
    expect(checkPlanId).toBe('plan_id');
    expect(checkIsUpgrade).toBe('is_upgrade');
    expect(checkCurrency).toBe('currency');
    expect(checkFromPlanName).toBe('from_plan_name');
    expect(mapped.payment_method).toBe('card');
  });

  it('converts all PaymentLogPayload keys correctly', () => {
    // Simulates the full postPaymentLog conversion
    const result = toSnakeCaseKeys({
      paymentMethod: 'card' as const,
      event: 'card_payment_api_error' as const,
      errorMessage: 'timeout',
      errorCode: '504',
      planId: 42,
      step: 'submit' as const,
      isUpgrade: true,
      cardType: 'saved' as const,
      discountApplied: false,
    });

    expect(result).toEqual({
      payment_method: 'card',
      event: 'card_payment_api_error',
      error_message: 'timeout',
      error_code: '504',
      plan_id: 42,
      step: 'submit',
      is_upgrade: true,
      card_type: 'saved',
      discount_applied: false,
    });
  });
});

describe('sigilEvents', () => {
  it('has card_3ds_challenge_shown event', () => {
    expect(SigilEvents.CARD_3DS_CHALLENGE_SHOWN).toBe('card_3ds_challenge_shown');
  });

  it('every SigilEvents value has a corresponding SigilEventPayloadMap entry', () => {
    // Type-level check: if a new event is added to SigilEvents but not wired
    // into SigilEventPayloadMap, this block will produce a compile error.
    const exhaustiveCheck: Record<(typeof SigilEvents)[keyof typeof SigilEvents], keyof SigilEventPayloadMap> = {
      [SigilEvents.PAYMENT_SUBMITTED]: SigilEvents.PAYMENT_SUBMITTED,
      [SigilEvents.PAYMENT_FAILED]: SigilEvents.PAYMENT_FAILED,
      [SigilEvents.PURCHASE_SUCCESS]: SigilEvents.PURCHASE_SUCCESS,
      [SigilEvents.UPGRADE_STARTED]: SigilEvents.UPGRADE_STARTED,
      [SigilEvents.CHECKOUT_START]: SigilEvents.CHECKOUT_START,
      [SigilEvents.CHECKOUT_METHOD_SELECTED]: SigilEvents.CHECKOUT_METHOD_SELECTED,
      [SigilEvents.CARD_3DS_CHALLENGE_SHOWN]: SigilEvents.CARD_3DS_CHALLENGE_SHOWN,
      [SigilEvents.PRICING_VIEW]: SigilEvents.PRICING_VIEW,
      [SigilEvents.DISCOUNT_CODE_APPLIED]: SigilEvents.DISCOUNT_CODE_APPLIED,
      [SigilEvents.DISCOUNT_CODE_REJECTED]: SigilEvents.DISCOUNT_CODE_REJECTED,
      [SigilEvents.DOWNLOAD_CLICK]: SigilEvents.DOWNLOAD_CLICK,
      [SigilEvents.DOWNLOAD_SEE_PLANS_CLICK]: SigilEvents.DOWNLOAD_SEE_PLANS_CLICK,
      [SigilEvents.SIGNUP_STARTED]: SigilEvents.SIGNUP_STARTED,
      [SigilEvents.SIGNUP_COMPLETED]: SigilEvents.SIGNUP_COMPLETED,
      [SigilEvents.SIGNUP_FAILED]: SigilEvents.SIGNUP_FAILED,
      [SigilEvents.LOGIN_STARTED]: SigilEvents.LOGIN_STARTED,
      [SigilEvents.LOGIN_COMPLETED]: SigilEvents.LOGIN_COMPLETED,
      [SigilEvents.LOGIN_FAILED]: SigilEvents.LOGIN_FAILED,
      [SigilEvents.ACTIVATION_COMPLETED]: SigilEvents.ACTIVATION_COMPLETED,
      [SigilEvents.ACTIVATION_FAILED]: SigilEvents.ACTIVATION_FAILED,
      [SigilEvents.PASSWORD_RESET_COMPLETED]: SigilEvents.PASSWORD_RESET_COMPLETED,
      [SigilEvents.CRYPTO_TX_SUBMITTED]: SigilEvents.CRYPTO_TX_SUBMITTED,
      [SigilEvents.PAGE_NOT_FOUND]: SigilEvents.PAGE_NOT_FOUND,
      [SigilEvents.SUBSCRIPTION_CANCELLED]: SigilEvents.SUBSCRIPTION_CANCELLED,
      [SigilEvents.SUBSCRIPTION_RESUMED]: SigilEvents.SUBSCRIPTION_RESUMED,
    };

    // Runtime check: every event name should be a string
    for (const value of Object.values(SigilEvents)) {
      expect(typeof value).toBe('string');
      expect(value).toBeTruthy();
    }

    expect(Object.keys(exhaustiveCheck)).toHaveLength(Object.keys(SigilEvents).length);
  });
});
