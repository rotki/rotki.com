import { set } from '@vueuse/core';
import { fetchWithCsrf } from '~/utils/api';
import { logger } from '~/utils/logger';
import { PaymentAssetResponse } from '~/types';

export const usePaymentCryptoStore = defineStore('payments/crypto', () => {
  const paymentAssetsLoading = ref(false);
  const paymentAssets = ref<PaymentAssetResponse>({});

  const fetchPaymentAssets = async (): Promise<void> => {
    set(paymentAssetsLoading, true);
    try {
      const response = await fetchWithCsrf<PaymentAssetResponse>('/webapi/payment/crypto/options', {
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
