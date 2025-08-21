import { set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type ApiResponse,
  type CreateCardNonceRequest,
  type CreateCardNonceResponse,
  type CreateCardRequest,
  SavedCard,
  SavedCardResponse,
} from '~/types';
import { useLogger } from '~/utils/use-logger';

export const usePaymentCardsStore = defineStore('payments/cards', () => {
  const card = ref<SavedCard>();

  const logger = useLogger('card-payment');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const getCard = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<SavedCardResponse>(
        '/webapi/payment/btr/cards/',
        {
          method: 'GET',
        },
      );
      const parsedResponse = SavedCardResponse.parse(response);
      set(card, parsedResponse.cardDetails);
    }
    catch (error) {
      logger.error(error);
    }
  };

  const addCard = async (request: CreateCardRequest): Promise<string> => {
    try {
      const response = await fetchWithCsrf<SavedCard>(
        '/webapi/payment/btr/cards/',
        {
          body: request,
          method: 'POST',
        },
      );
      const parsed = SavedCard.parse(response);
      return parsed.token;
    }
    catch (error: any) {
      logger.error(error);
      throw new Error(error.message);
    }
  };

  const deleteCard = async (token: string): Promise<void> => {
    try {
      await fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/payment/btr/cards/',
        {
          body: { paymentToken: token },
          method: 'DELETE',
        },
      );
      set(card, null);
    }
    catch (error) {
      logger.error(error);
    }
  };

  const createCardNonce = async (request: CreateCardNonceRequest): Promise<string> => {
    try {
      const response = await fetchWithCsrf<CreateCardNonceResponse>(
        '/webapi/payment/btr/cards/nonce/',
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
    addCard,
    card,
    createCardNonce,
    deleteCard,
    getCard,
  };
});
