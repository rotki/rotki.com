import { afterEach, assert, describe, expect, it, vi } from 'vitest';

import { createFetchError } from '../../utils';

const mockFetchWithCsrf = vi.fn();

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useAuthHintCookie: () => ({ value: undefined }),
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
  useSessionIdCookie: () => ({ value: undefined }),
}));

describe('useCryptoPaymentApi', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('deletePendingPayment', () => {
    it('returns success when the backend confirms the deletion', async () => {
      mockFetchWithCsrf.mockResolvedValueOnce({ result: true });

      const { useCryptoPaymentApi } = await import('~/modules/checkout/composables/use-crypto-payment-api');
      const { deletePendingPayment } = useCryptoPaymentApi();

      const result = await deletePendingPayment();

      assert(!result.isError);
      expect(result.result).toBe(true);
      expect(mockFetchWithCsrf).toHaveBeenCalledWith(
        '/webapi/2/crypto/payment/pending/',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('treats a 409 (no pending payment after a failed creation) as success so the Back button is not blocked', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(409, { message: 'No pending payment found for kelsos', result: false }),
      );

      const { useCryptoPaymentApi } = await import('~/modules/checkout/composables/use-crypto-payment-api');
      const { deletePendingPayment } = useCryptoPaymentApi();

      const result = await deletePendingPayment();

      assert(!result.isError);
      expect(result.result).toBe(true);
    });

    it('still surfaces other failures (e.g. 500) as errors', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(500));

      const { useCryptoPaymentApi } = await import('~/modules/checkout/composables/use-crypto-payment-api');
      const { deletePendingPayment } = useCryptoPaymentApi();

      const result = await deletePendingPayment();

      assert(result.isError);
    });
  });
});
