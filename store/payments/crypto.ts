import { set } from '@vueuse/core';
import { PaymentAssetResponse } from '~/types';
import { fetchWithCsrf } from '~/utils/api';
import { useLogger } from '~/utils/use-logger';

export const usePaymentCryptoStore = defineStore('payments/crypto', () => {
  const paymentAssetsLoading = ref(false);
  const paymentAssets = ref<PaymentAssetResponse>({});

  const logger = useLogger('crypto-payment');

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
