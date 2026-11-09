import { THREE_D_SECURE_SESSION_KEY, type ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { SigilEvents } from '@rotki/sigil';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThreeDSecure } from '~/modules/checkout/composables/use-three-d-secure';
import { PAYMENT_COMPLETED_KEY } from '~/modules/checkout/constants';
import { rejected, toPaymentFailure, unexpected } from '~/modules/checkout/utils/payment-failure';
import { createFetchError } from '../../utils';

const { chronicle, pay, upgrade, requestRefresh, verifyCard, teardown } = vi.hoisted(() => ({
  chronicle: vi.fn(),
  pay: vi.fn(),
  upgrade: vi.fn(),
  requestRefresh: vi.fn(),
  verifyCard: vi.fn(),
  teardown: vi.fn(async () => {}),
}));

vi.mock('braintree-web/client', () => ({
  create: vi.fn(async () => ({})),
}));

vi.mock('braintree-web/three-d-secure', () => ({
  create: vi.fn(async () => ({ on: vi.fn(), off: vi.fn(), verifyCard, teardown })),
}));

vi.mock('~/modules/checkout/composables/use-payment-api', () => ({
  usePaymentApi: () => ({ pay, upgrade }),
}));

vi.mock('~/modules/checkout/composables/use-payment-logger', () => ({
  usePaymentLogger: () => ({ logPaymentEvent: vi.fn() }),
}));

vi.mock('~/composables/chronicling/use-sigil-events', () => ({
  useSigilEvents: () => ({ chronicle }),
}));

vi.mock('~/composables/use-app-events', () => ({
  useAccountRefresh: () => ({ requestRefresh, onRefresh: vi.fn() }),
}));

// `useI18n` needs a setup context these tests lack; sigil's `paymentErrorCopy` tests cover the real mapping
vi.mock('~/modules/checkout/composables/use-payment-error-message', () => ({
  usePaymentErrorMessage: () => ({
    userMessageFor: ({ message }: { message: string }) => message,
  }),
}));

const PARAMS: ThreeDSecureParams = {
  amount: '25.00',
  finalAmount: '22.50',
  renewingPrice: '25.00',
  bin: '411111',
  nonce: 'card-nonce',
  planId: 3,
  token: 'client-token',
  discountCode: 'SUMMER',
  durationInMonths: 1,
  planName: 'basic',
};

function store(params: unknown): void {
  sessionStorage.setItem(THREE_D_SECURE_SESSION_KEY, JSON.stringify(params));
}

function confirmed(): { nonce: string; threeDSecureInfo: { liabilityShifted: boolean } } {
  return { nonce: 'verified-nonce', threeDSecureInfo: { liabilityShifted: true } };
}

describe('useThreeDSecure', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    pay.mockResolvedValue({ ok: true, value: true });
    upgrade.mockResolvedValue({ ok: true, value: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('reports a missing handoff as an error without params, so the page can explain it', async () => {
    const { initializeProcess, state, params, failure } = useThreeDSecure();

    await expect(initializeProcess()).resolves.toEqual({ success: false });

    expect(state.value).toBe('error');
    expect(params.value).toBeUndefined();
    expect(failure.value).toBeUndefined();
  });

  it('drops a handoff that does not match the schema', async () => {
    store({ ...PARAMS, planId: -1 });
    const { initializeProcess, params } = useThreeDSecure();

    await initializeProcess();

    expect(params.value).toBeUndefined();
    expect(sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY)).toBeNull();
  });

  it('charges the verified nonce, records the purchase and leaves a receipt for the success page', async () => {
    store(PARAMS);
    verifyCard.mockResolvedValue(confirmed());
    const { initializeProcess, params } = useThreeDSecure();

    await expect(initializeProcess()).resolves.toMatchObject({ success: true });

    expect(params.value?.planName).toBe('basic');
    expect(verifyCard).toHaveBeenCalledWith(expect.objectContaining({ amount: '22.50', bin: '411111', nonce: 'card-nonce' }));
    expect(pay).toHaveBeenCalledExactlyOnceWith({ planId: 3, paymentMethodNonce: 'verified-nonce', discountCode: 'SUMMER' });
    expect(chronicle).toHaveBeenCalledWith(SigilEvents.PURCHASE_SUCCESS, expect.objectContaining({ planId: 3, revenue: 22.5 }));
    expect(requestRefresh).toHaveBeenCalled();
    expect(JSON.parse(sessionStorage.getItem(PAYMENT_COMPLETED_KEY) ?? '{}')).toEqual({
      method: 'card',
      planName: 'basic',
      durationInMonths: 1,
      paid: '22.50',
      renewingPrice: '25.00',
      upgrade: false,
    });
    expect(sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY)).toBeNull();
  });

  it('upgrades the subscription when the handoff carries one', async () => {
    store({ ...PARAMS, upgradeSubId: 'sub-1' });
    verifyCard.mockResolvedValue(confirmed());
    const { initializeProcess } = useThreeDSecure();

    await initializeProcess();

    expect(upgrade).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ paymentMethodNonce: 'verified-nonce' }), 'sub-1');
    expect(pay).not.toHaveBeenCalled();
  });

  it('marks a payment the bank did not confirm, without charging', async () => {
    store(PARAMS);
    verifyCard.mockResolvedValue({ nonce: 'n', threeDSecureInfo: { liabilityShifted: false, status: 'authenticate_failed' } });
    const { initializeProcess, failure, state } = useThreeDSecure();

    await expect(initializeProcess()).resolves.toMatchObject({ success: false });

    expect(failure.value).toBe('not-confirmed');
    expect(state.value).toBe('error');
    expect(pay).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(PAYMENT_COMPLETED_KEY)).toBeNull();
  });

  it('treats a cancelled or broken challenge as not confirmed', async () => {
    store(PARAMS);
    verifyCard.mockRejectedValue(new Error('cancelled'));
    const { initializeProcess, failure } = useThreeDSecure();

    await initializeProcess();

    expect(failure.value).toBe('not-confirmed');
    expect(pay).not.toHaveBeenCalled();
  });

  it('keeps the backend\'s decline message when the charge fails after the confirmation', async () => {
    store(PARAMS);
    verifyCard.mockResolvedValue(confirmed());
    pay.mockResolvedValue({ ok: false, error: rejected('Do Not Honor') });
    const { initializeProcess, failure, error } = useThreeDSecure();

    await initializeProcess();

    expect(failure.value).toBe('payment');
    expect(error.value).toBe('Do Not Honor');
  });

  it('shows the server error overlay on a 5xx', async () => {
    store(PARAMS);
    verifyCard.mockResolvedValue(confirmed());
    pay.mockResolvedValue({ ok: false, error: toPaymentFailure(createFetchError(502)) });
    const { initializeProcess, serverError, failure } = useThreeDSecure();

    await initializeProcess();

    expect(serverError.value).toBe(true);
    expect(failure.value).toBe('payment');
    expect(requestRefresh).toHaveBeenCalled();
  });

  it('never shows a bug\'s message as a decline, and cannot rule out the charge', async () => {
    store(PARAMS);
    verifyCard.mockResolvedValue(confirmed());
    pay.mockResolvedValue({ ok: false, error: unexpected(new TypeError('cannot read properties of undefined')) });
    const { initializeProcess, serverError, error } = useThreeDSecure();

    await initializeProcess();

    expect(serverError.value).toBe(true);
    expect(error.value).not.toContain('cannot read properties');
  });
});
