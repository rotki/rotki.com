import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useMainStore } from '~/store';
import { createAccount } from '../components/account/home/account-fixture';

const { fetchWithCsrf, getAccount } = vi.hoisted(() => ({
  fetchWithCsrf: vi.fn(),
  getAccount: vi.fn(),
}));

vi.mock('~/composables/account/use-account-api', () => ({
  useAccountApi: () => ({ getAccount }),
}));

vi.mock('~/composables/account/use-auth-api', () => ({
  useAuthApi: () => ({ login: vi.fn(), logout: vi.fn() }),
}));

vi.mock('~/composables/subscription/use-user-subscriptions', () => ({
  useUserSubscriptions: () => ({
    refresh: vi.fn(),
    userSubscriptions: ref([]),
  }),
}));

vi.mock('~/composables/use-app-events', () => ({
  useAccountRefresh: () => ({ onRefresh: vi.fn() }),
}));

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useAuthHintCookie: () => ref<string>(),
  useEmailConfirmedCookie: () => ref<boolean>(),
  useFetchWithCsrf: () => ({ fetchWithCsrf, setHooks: vi.fn() }),
}));

vi.mock('~/modules/checkout/composables/use-pending-subscription-id', () => ({
  usePendingSubscriptionId: () => ({
    clearPendingSubscriptionId: vi.fn(),
    pendingSubscriptionId: ref<string>(),
    setPendingSubscriptionId: vi.fn(),
  }),
}));

vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({ debug: vi.fn(), error: vi.fn() }),
}));

describe('main store Braintree payment availability', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    fetchWithCsrf.mockReset();
  });

  it('updates availability from the Braintree endpoint', async () => {
    fetchWithCsrf.mockResolvedValue({ enabled: false });
    const store = useMainStore();

    await store.fetchBraintreePaymentAvailability();

    expect(fetchWithCsrf).toHaveBeenCalledWith(
      '/webapi/2/braintree/payment/enabled',
      { method: 'GET' },
    );
    expect(store.braintreePaymentEnabled).toBe(false);
  });

  it('fails open when availability cannot be refreshed', async () => {
    fetchWithCsrf
      .mockResolvedValueOnce({ enabled: false })
      .mockRejectedValueOnce(new Error('unavailable'));
    const store = useMainStore();

    await store.fetchBraintreePaymentAvailability();
    await store.fetchBraintreePaymentAvailability();

    expect(store.braintreePaymentEnabled).toBe(true);
  });

  it('deduplicates simultaneous availability requests', async () => {
    fetchWithCsrf.mockResolvedValue({ enabled: true });
    const store = useMainStore();

    await Promise.all([
      store.fetchBraintreePaymentAvailability(),
      store.fetchBraintreePaymentAvailability(),
    ]);

    expect(fetchWithCsrf).toHaveBeenCalledOnce();
  });
});

describe('main store card payment check', () => {
  /** A history entry as `fetchWithCsrf` hands it over, keys already camelCase. */
  function payment(paidUsing: string) {
    return {
      durationInMonths: 1,
      eurAmount: 25,
      identifier: paidUsing,
      legacy: false,
      paidAt: '2026-10-01T10:00:00Z',
      paidUsing,
      plan: 'basic',
    };
  }

  beforeEach(() => {
    setActivePinia(createPinia());
    fetchWithCsrf.mockReset();
    getAccount.mockResolvedValue(createAccount({ hasActiveSubscription: false }));
  });

  it('is not checked before the account loads', () => {
    expect(useMainStore().cardPaymentChecked).toBe(false);
  });

  it('finds a card payment in the history and marks the check done', async () => {
    fetchWithCsrf.mockResolvedValue({ result: [payment('PAYPAL'), payment('CREDIT_CARD')] });
    const store = useMainStore();

    await store.getAccount();

    expect(fetchWithCsrf).toHaveBeenCalledWith('/webapi/2/history/payments/', { method: 'GET' });
    expect(store.hasCardPayment).toBe(true);
    expect(store.cardPaymentChecked).toBe(true);
  });

  it('marks the check done when the history cannot be read', async () => {
    fetchWithCsrf.mockRejectedValue(new Error('unavailable'));
    const store = useMainStore();

    await store.getAccount();

    expect(store.hasCardPayment).toBe(false);
    expect(store.cardPaymentChecked).toBe(true);
  });

  it('starts over on logout', async () => {
    fetchWithCsrf.mockResolvedValue({ result: [payment('CREDIT_CARD')] });
    const store = useMainStore();
    await store.getAccount();

    await store.logout();

    expect(store.hasCardPayment).toBe(false);
    expect(store.cardPaymentChecked).toBe(false);
  });
});
