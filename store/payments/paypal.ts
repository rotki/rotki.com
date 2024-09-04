import { set } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';
import {
  type ApiResponse,
  type CreatePaypalNonceRequest,
  type CreatePaypalNonceResponse,
  SavedPaypalAccount,
  SavedPaypalResponse,
  type VaultPaypalRequest,
} from '~/types';
import { fetchWithCsrf } from '~/utils/api';

export const usePaymentPaypalStore = defineStore('payments/paypal', () => {
  const paypal = ref<SavedPaypalAccount>();

  const logger = useLogger('paypal');

  const getPaypal = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<SavedPaypalResponse>(
        '/webapi/payment/btr/paypal/',
        {
          method: 'GET',
        },
      );
      const parsedResponse = SavedPaypalResponse.parse(response);
      set(paypal, parsedResponse.paypalDetails);
    }
    catch (error) {
      logger.error(error);
    }
  };

  const addPaypal = async (request: VaultPaypalRequest): Promise<string> => {
    try {
      const response = await fetchWithCsrf<SavedPaypalAccount>(
        '/webapi/payment/btr/paypal/',
        {
          body: request,
          method: 'POST',
        },
      );
      const parsed = SavedPaypalAccount.parse(response);
      return parsed.token;
    }
    catch (error: any) {
      logger.error(error);
      throw new Error(error.message);
    }
  };

  const deletePaypal = async (token: string): Promise<void> => {
    try {
      await fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/payment/btr/paypal/',
        {
          body: { paymentToken: token },
          method: 'DELETE',
        },
      );
      set(paypal, undefined);
    }
    catch (error) {
      logger.error(error);
    }
  };

  const createPaypalNonce = async (request: CreatePaypalNonceRequest): Promise<string> => {
    try {
      const response = await fetchWithCsrf<CreatePaypalNonceResponse>(
        '/webapi/payment/btr/paypal/nonce/',
        {
          body: request,
          method: 'POST',
        },
      );
      return response.paymentNonce;
    }
    catch (error: any) {
      logger.error(error);
      throw new Error(error.message);
    }
  };

  return {
    addPaypal,
    createPaypalNonce,
    deletePaypal,
    getPaypal,
    paypal,
  };
});
