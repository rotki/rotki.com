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
import { addCardErrorMessage, type AddCardFailure, isCardAddedFailure } from '@rotki/checkout-ui/utils/add-card-error';
import { get } from '@vueuse/shared';
import { fromPromise, type ResultAsync } from 'plainfp/result-async';
import { useEmailConfirmedCookie, useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type PaymentFailure, toPaymentFailure } from '~/modules/checkout/utils/payment-failure';
import { nonEmpty } from '~/utils/non-empty';
import { useLogger } from '~/utils/use-logger';

interface UsePaymentCardsReturn {
  cards: Ref<SavedCard[]>;
  loading: Ref<boolean>;
  /** The saved cards could not be loaded, so an empty list does not mean there are none. */
  loadFailed: Ref<boolean>;
  addCard: (request: AddCardPayload) => Promise<string>;
  createCardNonce: (request: CreateCardNoncePayload) => Promise<string>;
  deleteCard: (token: string) => ResultAsync<ApiResponse<boolean>, PaymentFailure>;
  refresh: () => Promise<void>;
  setDefaultCard: (token: string) => Promise<void>;
}

export function usePaymentCards(): UsePaymentCardsReturn {
  const logger = useLogger('card-payment');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const emailConfirmed = useEmailConfirmedCookie();
  const { t } = useI18n();

  function addCardFailure(error: any): AddCardFailure {
    return { code: error?.data?.code, message: error?.data?.message, status: error?.statusCode };
  }

  function buildAddCardError(error: any): Error {
    const message = addCardErrorMessage(t, addCardFailure(error));
    return new Error(message ?? nonEmpty(error?.data?.message) ?? nonEmpty(error?.message) ?? t('common.error_occurred'));
  }

  const { data, error: loadError, pending, refresh } = useAsyncData<SavedCard[]>(
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
        throw error;
      }
    },
    {
      dedupe: 'defer',
      default: () => [],
      lazy: true,
      server: false,
    },
  );

  const cards = computed<SavedCard[]>(() => data.value ?? []);
  const loading = computed<boolean>(() => pending.value);
  const loadFailed = computed<boolean>(() => !!loadError.value);

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
      if (isCardAddedFailure(addCardFailure(error))) {
        await refresh();
      }
      throw buildAddCardError(error);
    }
  };

  const deleteCard = async (token: string): ResultAsync<ApiResponse<boolean>, PaymentFailure> => {
    const deleted = await fromPromise(
      fetchWithCsrf<ApiResponse<boolean>>(
        '/webapi/payment/btr/cards/',
        {
          body: { paymentToken: token },
          method: 'DELETE',
        },
      ),
      (cause) => {
        logger.error(cause);
        return toPaymentFailure(cause);
      },
    );
    if (deleted.ok)
      await refresh();
    return deleted;
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
    loadFailed,
    loading,
    refresh,
    setDefaultCard,
  };
}
