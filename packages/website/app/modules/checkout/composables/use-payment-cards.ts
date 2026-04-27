import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import {
  type AddCardPayload,
  type CreateCardNoncePayload,
  type CreateCardNonceResponse,
  CreateCardNonceResponseSchema,
  type SavedCard,
  type SavedCardResponse,
  SavedCardResponseSchema,
  SavedCardSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { get } from '@vueuse/shared';
import { useEmailConfirmedCookie, useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

interface UsePaymentCardsReturn {
  cards: Ref<SavedCard[]>;
  loading: Ref<boolean>;
  addCard: (request: AddCardPayload) => Promise<string>;
  createCardNonce: (request: CreateCardNoncePayload) => Promise<string>;
  deleteCard: (token: string) => Promise<void>;
  refresh: () => Promise<void>;
  setDefaultCard: (token: string) => Promise<void>;
}

export function usePaymentCards(): UsePaymentCardsReturn {
  const logger = useLogger('card-payment');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const emailConfirmed = useEmailConfirmedCookie();
  const { t } = useI18n();

  function buildAddCardError(error: any): Error {
    if (error?.statusCode === 429) {
      const backendMessage: string = error?.data?.message ?? '';
      const message = backendMessage.toLowerCase().includes('failed')
        ? t('home.account.payment_methods.errors.rate_limited_failures')
        : t('home.account.payment_methods.errors.rate_limited');
      return new Error(message);
    }
    // 400s on this endpoint are either schema/JSON-decode errors (frontend bugs the user
    // can't act on) or Braintree gateway errors (raw "Do Not Honor"-style dumps that read
    // like a stack trace). Substitute a friendly message; raw cause is kept in the logs.
    if (error?.statusCode === 400) {
      return new Error(t('home.account.payment_methods.errors.card_declined'));
    }
    return new Error(error?.data?.message || error?.message || t('common.error_occurred'));
  }

  const { data, pending, refresh } = useAsyncData<SavedCard[]>(
    'payment-cards',
    async () => {
      if (!get(emailConfirmed)) {
        return [];
      }

      try {
        const response = await fetchWithCsrf<SavedCardResponse>(
          '/webapi/payment/btr/cards/',
          {
            method: 'GET',
          },
        );
        const parsedResponse = SavedCardResponseSchema.parse(response);
        return parsedResponse.cards;
      }
      catch (error) {
        logger.error(error);
        return [];
      }
    },
    {
      default: () => [],
      lazy: true,
      server: false,
    },
  );

  const cards = computed<SavedCard[]>(() => data.value ?? []);
  const loading = computed<boolean>(() => pending.value);

  const addCard = async (request: AddCardPayload): Promise<string> => {
    try {
      const response = await fetchWithCsrf<SavedCard>(
        '/webapi/payment/btr/cards/',
        {
          body: request,
          method: 'POST',
        },
      );
      const parsed = SavedCardSchema.parse(response);
      await refresh();
      return parsed.token;
    }
    catch (error: any) {
      logger.error(error);
      throw buildAddCardError(error);
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
      await refresh();
    }
    catch (error) {
      logger.error(error);
    }
  };

  const setDefaultCard = async (token: string): Promise<void> => {
    try {
      await fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/2/braintree/cards/default',
        {
          body: { payment_method_nonce: token },
          method: 'POST',
        },
      );
      await refresh();
    }
    catch (error) {
      logger.error(error);
      throw error;
    }
  };

  const createCardNonce = async (request: CreateCardNoncePayload): Promise<string> => {
    try {
      const response = await fetchWithCsrf<CreateCardNonceResponse>(
        '/webapi/payment/btr/cards/nonce/',
        {
          body: request,
          method: 'POST',
        },
      );
      const parsed = CreateCardNonceResponseSchema.parse(response);
      return parsed.paymentNonce;
    }
    catch (error: any) {
      logger.error(error);
      throw new Error(error.message);
    }
  };

  return {
    addCard,
    cards,
    createCardNonce,
    deleteCard,
    loading,
    refresh,
    setDefaultCard,
  };
}
