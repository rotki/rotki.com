import { FetchError } from 'ofetch';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockFetchWithCsrf = vi.fn();
const mockRequestRefresh = vi.fn();

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
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
    client: ref(undefined),
    initializeClientWithToken: vi.fn(),
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

function createFetchError(status: number, data?: any): FetchError {
  const error = new FetchError(`Request failed with status ${status}`);
  error.status = status;
  error.statusCode = status;
  error.data = data;
  return error;
}

describe('usePaypalPaymentFlow', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('submitPayment', () => {
    it('should return success on successful payment', async () => {
      mockFetchWithCsrf.mockResolvedValueOnce({ result: true });

      const { usePaypalPaymentFlow } = await import(
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
        '~/modules/checkout/composables/use-paypal-payment-flow'
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
