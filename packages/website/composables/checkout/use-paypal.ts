import type { SavedPaypalAccount } from '~/types';
import { usePaypalApi } from '~/composables/checkout/use-paypal-api';

interface UsePaypalReturn {
  paypal: Readonly<Ref<SavedPaypalAccount | undefined>>;
  loading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<Error | null>>;
  refresh: () => Promise<void>;
}

/**
 * PayPal data management composable
 * Provides reactive PayPal account data with lazy loading
 */
export function usePaypal(): UsePaypalReturn {
  const { fetchPaypalAccount } = usePaypalApi();

  const {
    data: paypal,
    error,
    execute,
    pending: loading,
    refresh,
  } = useLazyAsyncData<SavedPaypalAccount | undefined>(
    'paypal-account',
    async () => {
      try {
        return await fetchPaypalAccount();
      }
      catch {
        // Return undefined on error to handle gracefully
        return undefined;
      }
    },
    {
      default: () => undefined,
      immediate: false,
    },
  );

  // Initialize data on first use
  onBeforeMount(execute);

  return {
    paypal: readonly(paypal) as Readonly<Ref<SavedPaypalAccount | undefined>>,
    loading: readonly(loading),
    error: readonly(error),
    refresh,
  };
}
