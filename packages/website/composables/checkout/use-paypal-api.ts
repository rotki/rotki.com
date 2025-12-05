import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type CreatePaypalNonceRequest,
  type CreatePaypalNonceResponse,
  SavedPaypalAccount,
  SavedPaypalResponse,
  type VaultPaypalRequest,
} from '~/types';
import { useLogger } from '~/utils/use-logger';

/**
 * PayPal API composable
 * Handles all PayPal-related API operations
 */
export function usePaypalApi() {
  const logger = useLogger('paypal-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Fetch saved PayPal account details
   */
  const fetchPaypalAccount = async (): Promise<SavedPaypalAccount | undefined> => {
    try {
      const response = await fetchWithCsrf<SavedPaypalResponse>(
        '/webapi/payment/btr/paypal/',
        {
          method: 'GET',
        },
      );
      const parsedResponse = SavedPaypalResponse.parse(response);
      return parsedResponse.paypalDetails;
    }
    catch (error) {
      logger.error('Failed to fetch PayPal account:', error);
      throw error;
    }
  };

  /**
   * Add new PayPal account
   */
  const addPaypalAccount = async (request: VaultPaypalRequest): Promise<string> => {
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
      logger.error('Failed to add PayPal account:', error);
      throw new Error(error.message);
    }
  };

  /**
   * Delete PayPal account
   */
  const deletePaypalAccount = async (token: string): Promise<void> => {
    try {
      await fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/payment/btr/paypal/',
        {
          body: { paymentToken: token },
          method: 'DELETE',
        },
      );
    }
    catch (error) {
      logger.error('Failed to delete PayPal account:', error);
      throw error;
    }
  };

  /**
   * Create PayPal payment nonce
   */
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
      logger.error('Failed to create PayPal nonce:', error);
      throw new Error(error.message);
    }
  };

  return {
    addPaypalAccount,
    createPaypalNonce,
    deletePaypalAccount,
    fetchPaypalAccount,
  };
}
