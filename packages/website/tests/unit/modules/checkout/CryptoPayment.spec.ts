import type { CryptoPaymentResult } from '~/modules/checkout/composables/use-crypto-payment-flow';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { get, set } from '@vueuse/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import CryptoPayment from '~/modules/checkout/components/crypto/CryptoPayment.vue';

interface CheckoutError {
  title: string;
  message: string;
}

const SELECTED_PLAN = { planId: 1, months: 1, priceInEur: '10', price: '10' };

// Shared, reactive mock state so setError/clearError actually mutate the
// error ref the component renders — this is what the redirect logic inspects.
// Everything referenced by the hoisted vi.mock factories must live in
// vi.hoisted so it exists before the mocks run.
const {
  error,
  paymentData,
  ensureInitialized,
  createPayment,
  setError,
  clearError,
  navigateTo,
} = await vi.hoisted(async () => {
  const { ref } = await import('vue');
  const { set } = await import('@vueuse/shared');
  const error = ref<CheckoutError>();
  return {
    error,
    paymentData: ref<unknown>(),
    ensureInitialized: vi.fn<() => Promise<boolean>>(),
    createPayment: vi.fn<() => Promise<CryptoPaymentResult>>(),
    setError: vi.fn((title: string, message: string) => {
      set(error, { title, message });
    }),
    clearError: vi.fn(() => {
      set(error, undefined);
    }),
    navigateTo: vi.fn(),
  };
});

mockNuxtImport('navigateTo', () => navigateTo);

vi.mock('~/modules/checkout/composables/use-checkout', () => ({
  useCheckout: () => ({
    loading: ref(false),
    error,
    selectedPlan: ref(SELECTED_PLAN),
    breakdown: ref(undefined),
    upgradeSubId: ref(undefined),
    subscriptionId: ref(undefined),
    currency: ref('ETH'),
    modelDiscountCode: ref(''),
    validDiscountCode: ref(undefined),
    planSwitchLoading: ref(false),
    planId: ref(1),
    clearError,
    setError,
    setLoading: vi.fn(),
    applyDiscount: vi.fn(),
    ensureInitialized,
    switchPlan: vi.fn(),
  }),
}));

vi.mock('~/modules/checkout/composables/use-crypto-payment-flow', () => ({
  useCryptoPaymentFlow: () => ({
    paymentData,
    loading: ref(false),
    createPayment,
    switchPlan: vi.fn(),
    cancelPayment: vi.fn(),
    markTransactionStarted: vi.fn(),
    reset: vi.fn(),
  }),
}));

async function mountComponent() {
  return mountSuspended(CryptoPayment, {
    global: {
      stubs: {
        PaymentLayout: { template: '<div><slot name="description" /><slot /></div>' },
        CheckoutDescription: true,
        CryptoPaymentForm: true,
        CryptoPaymentActions: true,
      },
    },
  });
}

describe('cryptoPayment.vue redirect on failure', () => {
  beforeEach(() => {
    set(error, undefined);
    set(paymentData, undefined);
    navigateTo.mockClear();
    setError.mockClear();
    clearError.mockClear();
    ensureInitialized.mockReset();
    createPayment.mockReset();
  });

  it('keeps the user on the page and shows the error when the crypto payment API returns 400', async () => {
    ensureInitialized.mockResolvedValue(true);
    // Mirrors a 400 from /webapi/2/crypto/payments surfaced through the flow.
    createPayment.mockResolvedValue({ success: false, error: 'Invalid plan' });

    await mountComponent();

    expect(setError).toHaveBeenCalled();
    expect(get(error)?.message).toBe('Invalid plan');
    // Regression: previously the onMounted hook redirected to /products,
    // wiping the error before the user could read it.
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it('redirects to products when initialization fails with no error to show', async () => {
    // e.g. plans could not be loaded — nothing to display, so bouncing back
    // to the products page is the right behavior.
    ensureInitialized.mockResolvedValue(false);

    await mountComponent();

    expect(get(error)).toBeUndefined();
    expect(navigateTo).toHaveBeenCalledWith('/products');
  });
});
