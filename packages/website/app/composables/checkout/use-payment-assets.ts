import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { PaymentAssetResponse } from '~/types';

interface UsePaymentAssetsReturn {
  paymentAssets: Readonly<Ref<PaymentAssetResponse>>;
  paymentAssetsLoading: Readonly<Ref<boolean>>;
  refreshPaymentAssets: () => Promise<void>;
}

/**
 * Composable for fetching and managing payment assets
 * Uses useLazyAsyncData for caching and loading states
 */
export function usePaymentAssets(): UsePaymentAssetsReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const { data: paymentAssets, pending: paymentAssetsLoading, refresh: refreshPaymentAssets, execute } = useLazyAsyncData(
    'payment-assets',
    async (): Promise<PaymentAssetResponse> => {
      const response = await fetchWithCsrf<PaymentAssetResponse>('/webapi/payment/crypto/options/', {
        method: 'GET',
      });
      return PaymentAssetResponse.parse(response);
    },
    {
      default: () => ({}) satisfies PaymentAssetResponse,
    },
  );

  onBeforeMount(execute);

  return {
    paymentAssets: readonly(paymentAssets),
    paymentAssetsLoading: readonly(paymentAssetsLoading),
    refreshPaymentAssets,
  };
}
