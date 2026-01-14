import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { PaymentAssetResponse } from '~/types';

interface UsePaymentAssetsReturn {
  paymentAssets: Readonly<Ref<PaymentAssetResponse>>;
  paymentAssetsLoading: Readonly<Ref<boolean>>;
  refreshPaymentAssets: () => Promise<void>;
}

/**
 * Composable for fetching and managing payment assets
 * Uses useLazyAsyncData with dedupe to prevent multiple fetches
 * Nuxt's key-based deduplication handles sharing across components
 */
export function usePaymentAssets(): UsePaymentAssetsReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const { data: paymentAssets, pending: paymentAssetsLoading, refresh: refreshPaymentAssets } = useLazyAsyncData(
    'payment-assets',
    async (): Promise<PaymentAssetResponse> => {
      const response = await fetchWithCsrf<PaymentAssetResponse>('/webapi/payment/crypto/options/', {
        method: 'GET',
      });
      return PaymentAssetResponse.parse(response);
    },
    {
      default: () => ({}) satisfies PaymentAssetResponse,
      server: false,
      dedupe: 'defer', // Prevent new requests if one is already pending
    },
  );

  return {
    paymentAssets: readonly(paymentAssets),
    paymentAssetsLoading: readonly(paymentAssetsLoading),
    refreshPaymentAssets,
  };
}
