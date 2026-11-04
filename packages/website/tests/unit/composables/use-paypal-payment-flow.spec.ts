import { afterEach, describe, expect, it, vi } from 'vitest';
import { createFetchError } from '../../utils';

const mockFetchWithCsrf = vi.fn();
const mockRequestRefresh = vi.fn();

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
  useAuthHintCookie: () => ({ value: undefined }),
  useSessionIdCookie: () => ({ value: undefined }),
}));

vi.mock('~/composables/use-app-events', () => ({
  useAccountRefresh: () => ({
    requestRefresh: mockRequestRefresh,
    onRefresh: vi.fn(),
  }),
}));

vi.mock('~/modules/checkout/composables/use-braintree-client', () => ({
  useBraintreeClient: () => ({
    client: ref({}),
    initializeClientWithToken: vi.fn(async () => true),
  }),
}));

vi.mock('braintree-web/paypal-checkout', () => ({
  create: vi.fn(async () => ({ loadPayPalSDK: vi.fn(async () => {}) })),
}));

// `useI18n` needs a setup context these tests lack; sigil's `paymentErrorCopy` tests cover the real mapping
vi.mock('~/modules/checkout/composables/use-payment-error-message', () => ({
  usePaymentErrorMessage: () => ({
    userMessageFor: ({ message }: { message: string }) => message,
  }),
}));

vi.mock('~/modules/checkout/composables/use-paypal-api', () => ({
  usePaypalApi: () => ({
    addPaypalAccount: vi.fn(),
    createPaypalNonce: vi.fn(),
    deletePaypalAccount: vi.fn(),
    fetchPaypalAccount: vi.fn(),
  }),
}));

describe('usePaypalPaymentFlow', () => {
  afterEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(window, 'paypal');
  });

  describe('renderButton', () => {
    it('draws the buttons at the reserved height and returns once they are drawn', async () => {
      let drawn = false;
      const render = vi.fn(async () => {
        await Promise.resolve();
        drawn = true;
      });
      const Buttons = vi.fn(() => ({ render }));
      Object.assign(window, { paypal: { Buttons } });

      const { PAYPAL_BUTTON_HEIGHT, usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { initializeSdk, renderButton } = usePaypalPaymentFlow();

      await expect(initializeSdk('client-token', 25)).resolves.toEqual({ success: true });
      await renderButton({
        callbacks: { onPaymentCancel: vi.fn(), onPaymentError: vi.fn(), onPaymentStart: vi.fn(), onPaymentSuccess: vi.fn() },
        accepted: ref<boolean>(false),
        loading: ref<boolean>(false),
      });

      expect(Buttons).toHaveBeenCalledWith(expect.objectContaining({
        style: { height: PAYPAL_BUTTON_HEIGHT, tagline: false },
      }));
      expect(render).toHaveBeenCalledWith('#paypal-button');
      expect(drawn).toBe(true);
    });
  });

  describe('submitPayment', () => {
    it('should return success on successful payment', async () => {
      mockFetchWithCsrf.mockResolvedValueOnce({ result: true });

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', { planId: 1 });

      expect(result.success).toBe(true);
      expect(result.blocked).toBeUndefined();
      expect(mockRequestRefresh).toHaveBeenCalledOnce();
    });

    it('should return blocked on 500 server error', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(500));

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', { planId: 1 });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(mockRequestRefresh).toHaveBeenCalledOnce();
    });

    it('should return blocked on 502 server error', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(502));

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', { planId: 1 });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(true);
      expect(mockRequestRefresh).toHaveBeenCalledOnce();
    });

    it('should not block on 400 validation error', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(400, { message: 'Invalid discount code', result: false }),
      );

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', { planId: 1 });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(false);
      expect(result.error).toBe('Invalid discount code');
      expect(mockRequestRefresh).not.toHaveBeenCalled();
    });

    it('should not block on 403 unverified error', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(403));

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', { planId: 1 });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(false);
      expect(mockRequestRefresh).not.toHaveBeenCalled();
    });

    it('should not block on non-FetchError', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(new Error('Network error'));

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', { planId: 1 });

      expect(result.success).toBe(false);
      expect(result.blocked).toBe(false);
      expect(mockRequestRefresh).not.toHaveBeenCalled();
    });

    it('should call upgrade endpoint when upgradeSubId is provided', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(500));

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow',
      );
      const { submitPayment } = usePaypalPaymentFlow();

      const result = await submitPayment('nonce-123', {
        planId: 2,
        upgradeSubId: 'sub-789',
      });

      expect(result.blocked).toBe(true);
      expect(mockRequestRefresh).toHaveBeenCalledOnce();
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/webapi/2/braintree/upgrade',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
