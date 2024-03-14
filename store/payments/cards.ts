import { set } from '@vueuse/core';
import {
  type ApiResponse,
  type CreateCardNonceRequest,
  type CreateCardNonceResponse,
  type CreateCardRequest,
  SavedCard,
  type SavedCardResponse,
} from '~/types';
import { fetchWithCsrf } from '~/utils/api';
import { logger } from '~/utils/logger';

export const usePaymentCardsStore = defineStore('payments/cards', () => {
  const card = ref<SavedCard | null>(null);

  const getCard = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<SavedCardResponse>(
        '/webapi/payment/btr/cards',
        {
          method: 'GET',
        },
      );
      set(card, SavedCard.parse(response.cardDetails));
    }
    catch (error) {
      logger.error(error);
    }
  };

  const addCard = async (request: CreateCardRequest): Promise<string> => {
    try {
      const response = await fetchWithCsrf<SavedCard>(
        '/webapi/payment/btr/cards',
        {
          body: request,
          method: 'POST',
        },
      );
      const parsed = SavedCard.parse(response);
      return parsed.token;
    }
    catch (error) {
      logger.error(error);
      return '';
    }
  };

  const deleteCard = async (token: string): Promise<void> => {
    try {
      await fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/payment/btr/cards',
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
        '/webapi/payment/btr/cards/nonce',
        {
          body: request,
          method: 'POST',
        },
      );
      return response.paymentNonce;
    }
    catch (error) {
      logger.error(error);
      return '';
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
