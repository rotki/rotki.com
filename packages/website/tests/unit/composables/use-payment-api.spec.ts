import { afterEach, describe, expect, it, vi } from 'vitest';

import { PaymentError } from '~/types/codes';

import { createFetchError } from '../../utils';

const mockFetchWithCsrf = vi.fn();

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
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

      expect(result.isError).toBe(false);
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/webapi/2/braintree/payments',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should return SERVER_ERROR code on 500 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(500));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      expect(result.isError).toBe(true);
      if (result.isError) {
        expect(result.code).toBe(PaymentError.SERVER_ERROR);
      }
    });

    it('should return no special code on 400 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(400, { message: 'Invalid nonce', result: false }),
      );

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      expect(result.isError).toBe(true);
      if (result.isError) {
        expect(result.code).toBeUndefined();
        expect(result.error).toBeInstanceOf(Error);
        expect((result.error).message).toBe('Invalid nonce');
      }
    });

    it('should return UNVERIFIED code on 403 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(403));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { pay } = usePaymentApi();

      const result = await pay({
        planId: 1,
        paymentMethodNonce: 'nonce-123',
      });

      expect(result.isError).toBe(true);
      if (result.isError) {
        expect(result.code).toBe(PaymentError.UNVERIFIED);
      }
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

      expect(result.isError).toBe(false);
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

      expect(result.isError).toBe(true);
      if (result.isError) {
        expect(result.error.message).toBe('Upgrade not allowed');
      }
    });

    it('should return SERVER_ERROR code on 502 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(502));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { upgrade } = usePaymentApi();

      const result = await upgrade(
        { planId: 2, paymentMethodNonce: 'nonce-456' },
        'sub-789',
      );

      expect(result.isError).toBe(true);
      if (result.isError) {
        expect(result.code).toBe(PaymentError.SERVER_ERROR);
      }
    });

    it('should return UNVERIFIED code on 403 response', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(403));

      const { usePaymentApi } = await import('~/modules/checkout/composables/use-payment-api');
      const { upgrade } = usePaymentApi();

      const result = await upgrade(
        { planId: 2, paymentMethodNonce: 'nonce-456' },
        'sub-789',
      );

      expect(result.isError).toBe(true);
      if (result.isError) {
        expect(result.code).toBe(PaymentError.UNVERIFIED);
      }
    });
  });
});
