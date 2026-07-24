import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useMainStore } from '~/store';

const { fetchWithCsrf } = vi.hoisted(() => ({
  fetchWithCsrf: vi.fn(),
}));

vi.mock('~/composables/account/use-account-api', () => ({
  useAccountApi: () => ({ getAccount: vi.fn() }),
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
