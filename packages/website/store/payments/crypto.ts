import { set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { PaymentAssetResponse } from '~/types';
import { useLogger } from '~/utils/use-logger';

export const usePaymentCryptoStore = defineStore('payments/crypto', () => {
  const paymentAssetsLoading = ref(false);
  const paymentAssets = ref<PaymentAssetResponse>({});

  const logger = useLogger('crypto-payment');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const fetchPaymentAssets = async (): Promise<void> => {
    set(paymentAssetsLoading, true);
    try {
      const response = await fetchWithCsrf<PaymentAssetResponse>('/webapi/payment/crypto/options/', {
        method: 'GET',
      });
      set(paymentAssets, PaymentAssetResponse.parse(response));
    }
    catch (error) {
      logger.error(error);
    }
    finally {
      set(paymentAssetsLoading, false);
    }
  };

  return {
    fetchPaymentAssets,
    paymentAssets,
    paymentAssetsLoading,
  };
});
