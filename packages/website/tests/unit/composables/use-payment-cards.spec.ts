import { afterEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { createFetchError } from '../../utils';

const { mockFetchWithCsrf } = vi.hoisted(() => ({ mockFetchWithCsrf: vi.fn() }));

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  // ref(false) → useAsyncData('payment-cards', …) short-circuits to [] without calling
  // fetchWithCsrf, so the mocked rejection in each test is consumed by addCard, not the
  // auto-refresh. Must be a real Vue ref (a plain { value: false } is truthy under VueUse `get`).
  useEmailConfirmedCookie: () => ref(false),
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
}));

vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-i18n')>();
  return {
    ...actual,
    useI18n: () => ({
      t: (key: string): string => key,
    }),
  };
});

describe('usePaymentCards', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('addCard 429 handling', () => {
    it('uses the failures-specific i18n key when the backend body mentions a failure', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(429, { message: 'Too many failed attempts. Please try again later.' }),
      );

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('home.account.payment_methods.errors.rate_limited_failures');
    });

    it('uses the generic rate-limit i18n key for the total-attempts gate', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(429, { message: 'Too many attempts. Please try again later.' }),
      );

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('home.account.payment_methods.errors.rate_limited');
    });

    it('falls back to the generic rate-limit i18n key for upstream 429s without a JSON body (e.g. Traefik)', async () => {
      // Traefik / reverse-proxy 429s typically have no parsed JSON body.
      mockFetchWithCsrf.mockRejectedValueOnce(createFetchError(429, undefined));

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('home.account.payment_methods.errors.rate_limited');
    });
  });

  describe('addCard 400 handling', () => {
    it('replaces the raw Braintree gateway dump with the friendly card-declined string', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(400, {
          message: 'Error during payment token generation. Either try again later or get in '
            + 'contact with your payment provider. Error returned by payment provider was Do Not Honor',
        }),
      );

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('home.account.payment_methods.errors.card_declined');
    });

    it('uses the friendly card-declined string for schema/validation 400s too', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(400, { message: { payment_method_nonce: ['Missing data for required field.'] } }),
      );

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('home.account.payment_methods.errors.card_declined');
    });
  });

  describe('addCard other errors', () => {
    it('surfaces the backend message for non-400/429 statuses when present', async () => {
      mockFetchWithCsrf.mockRejectedValueOnce(
        createFetchError(500, { message: 'Internal failure' }),
      );

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('Internal failure');
    });

    it('falls back to common.error_occurred when no message is available', async () => {
      const error = createFetchError(500, undefined);
      // simulate a totally opaque error object
      delete (error as any).message;
      mockFetchWithCsrf.mockRejectedValueOnce(error);

      const { usePaymentCards } = await import('~/modules/checkout/composables/use-payment-cards');
      const { addCard } = usePaymentCards();

      await expect(addCard({ paymentMethodNonce: 'nonce' } as any))
        .rejects
        .toThrow('common.error_occurred');
    });
  });
});
