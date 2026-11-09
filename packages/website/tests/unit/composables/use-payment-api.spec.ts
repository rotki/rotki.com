import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { paymentFailureMessage } from '~/modules/checkout/utils/payment-failure';
import { createFetchError } from '../../utils';

const mockFetchWithCsrf = vi.fn();

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
  useAuthHintCookie: () => ({ value: undefined }),
  useSessionIdCookie: () => ({ value: undefined }),
}));

describe('usePaymentApi', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('pay', () => {
    it('should return success on successful payment', async () => {
      mockFetchWithCsrf.mockResolvedValueOnce({
        paymentMethodNonce: 'nonce-123',
        planId: 1,
      });

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      expect(result.ok).toBe(true);
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/webapi/2/braintree/payments',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should return a server error on 500 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(500));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      assert(!result.ok);
      expect(result.error._tag).toBe('ServerError');
    });

    it('should return the refusal from the backend on 400 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(400, { message: 'Invalid nonce', result: false }),
      );

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      assert(!result.ok);
      expect(result.error._tag).toBe('Rejected');
      expect(paymentFailureMessage(result.error)).toBe('Invalid nonce');
    });

    it('should return an unverified failure on 403 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(403));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      assert(!result.ok);
      expect(result.error._tag).toBe('Unverified');
    });
  });

  describe('upgrade', () => {
    it('should return success on successful upgrade', async () => {
      mockFetchWithCsrf.mockResolvedValueOnce({
        result: true,
        message: '',
      });

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { upgrade } = usePaymentApi();

      const result = await upgrade(
        { planId: 2, paymentMethodNonce: 'nonce-456' },
        'sub-789',
      );

      expect(result.ok).toBe(true);
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/webapi/2/braintree/upgrade',
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({ subscriptionId: 'sub-789' }),
        }),
      );
    });

    it('should return error when upgrade response result is false', async () => {
      mockFetchWithCsrf.mockResolvedValueOnce({
        result: false,
        message: 'Upgrade not allowed',
      });

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { upgrade } = usePaymentApi();

      const result = await upgrade(
        { planId: 2, paymentMethodNonce: 'nonce-456' },
        'sub-789',
      );

      assert(!result.ok);
      expect(paymentFailureMessage(result.error)).toBe('Upgrade not allowed');
    });

    it('should return a server error on 502 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(502));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { upgrade } = usePaymentApi();

      const result = await upgrade(
        { planId: 2, paymentMethodNonce: 'nonce-456' },
        'sub-789',
      );

      assert(!result.ok);
      expect(result.error._tag).toBe('ServerError');
    });

    it('should return an unverified failure on 403 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(403));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { upgrade } = usePaymentApi();

      const result = await upgrade(
        { planId: 2, paymentMethodNonce: 'nonce-456' },
        'sub-789',
      );

      assert(!result.ok);
      expect(result.error._tag).toBe('Unverified');
    });
  });
});
