import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type ApiResponse,
  type CreateCardNonceRequest,
  type CreateCardNonceResponse,
  type CreateCardRequest,
  SavedCard,
  SavedCardsResponse,
  type SavedCard as SavedCardType,
} from '~/types';
import { useLogger } from '~/utils/use-logger';

export const usePaymentCardsStore = defineStore('payments/cards', () => {
  const cards = ref<SavedCardType[]>([]);
  const loading = ref<boolean>(false);

  const logger = useLogger('card-payment');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const card = computed<SavedCardType | undefined>(() => {
    const allCards = get(cards);
    return allCards.find(card => card.linked) || allCards[0];
  });

  const getCards = async (): Promise<void> => {
    try {
      set(loading, true);
      const response = await fetchWithCsrf<SavedCardsResponse>(
        '/webapi/payment/btr/cards/',
        {
          method: 'GET',
        },
      );
      const parsedResponse = SavedCardsResponse.parse(response);
      set(cards, parsedResponse.cards);
    }
    catch (error) {
      logger.error(error);
    }
    finally {
      set(loading, false);
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
      // Refresh cards list after adding
      await getCards();
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
      // Refresh cards list to get updated state from server
      await getCards();
    }
    catch (error) {
      logger.error(error);
      throw error;
    }
  };

  const setDefaultCard = async (token: string): Promise<void> => {
    try {
      await fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/2/braintree/cards/default',
        {
          body: { payment_token: token },
          method: 'POST',
        },
      );
      // Refresh cards list to get updated state from server
      await getCards();
    }
    catch (error) {
      logger.error(error);
      throw error;
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
    cards,
    createCardNonce,
    deleteCard,
    getCard: getCards, // Keep backwards compatibility
    getCards,
    loading,
    setDefaultCard,
  };
});
