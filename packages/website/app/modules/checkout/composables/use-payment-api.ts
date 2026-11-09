import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import {
  type CardPaymentRequest,
  CardPaymentResponseSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { CheckoutPaymentMethods, CheckoutSteps, PaymentServerEvents } from '@rotki/sigil';
import { pipe } from 'plainfp/pipe';
import { err, ok } from 'plainfp/result';
import { flatMap, fromPromise, type ResultAsync } from 'plainfp/result-async';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { parseApiResult, type PaymentFailure, toPaymentFailure, unexpected } from '~/modules/checkout/utils/payment-failure';
import { nonEmpty } from '~/utils/non-empty';
import { useLogger } from '~/utils/use-logger';

type CardPayload = Omit<CardPaymentRequest, 'upgradeSubId'>;

interface UsePaymentApiReturn {
  pay: (payload: CardPayload) => ResultAsync<true, PaymentFailure>;
  upgrade: (payload: CardPayload, subscriptionId: string) => ResultAsync<true, PaymentFailure>;
}

interface UsePaymentApiOptions {
  /** Which method's failures the payment log should show. */
  method?: 'card' | 'paypal';
}

/**
 * Payment management API composable
 * Charges a vaulted payment method, which is how cards and PayPal both pay.
 *
 * These requests are never retried: the first one may have charged the buyer even if it failed.
 */
export function usePaymentApi({ method = 'card' }: UsePaymentApiOptions = {}): UsePaymentApiReturn {
  const logger = useLogger('payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { logPaymentEvent } = usePaymentLogger();

  /** Logs what a call threw, with the detail the failure itself leaves out, and sorts it. */
  function onThrown(label: string, planId: number, isUpgrade: boolean): (cause: any) => PaymentFailure {
    return (cause) => {
      logger.error(label, cause);
      logPaymentEvent({
        paymentMethod: method === 'paypal' ? CheckoutPaymentMethods.PAYPAL : CheckoutPaymentMethods.CARD,
        event: method === 'paypal' ? PaymentServerEvents.PAYPAL_SUBMIT_ERROR : PaymentServerEvents.CARD_PAYMENT_API_ERROR,
        errorMessage: nonEmpty(cause?.message) ?? 'unknown',
        errorCode: String(cause?.statusCode ?? ''),
        step: CheckoutSteps.SUBMIT,
        planId,
        isUpgrade,
      });
      return toPaymentFailure(cause);
    };
  }

  /**
   * Upgrade an existing subscription
   */
  async function upgrade(payload: CardPayload, subscriptionId: string): ResultAsync<true, PaymentFailure> {
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/braintree/upgrade', {
        body: { ...payload, subscriptionId },
        method: 'POST',
        retry: false,
      }), onThrown('Upgrade failed:', payload.planId, true)),
      flatMap(async (response): ResultAsync<true, PaymentFailure> => {
        const parsed = await parseApiResult(ActionResultResponseSchema)(response);
        return parsed.ok ? ok(true) : parsed;
      }),
    );
  }

  /**
   * Process a new card payment
   */
  async function pay(payload: CardPayload): ResultAsync<true, PaymentFailure> {
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/braintree/payments', {
        body: payload,
        method: 'POST',
        retry: false,
      }), onThrown('Payment failed:', payload.planId, false)),
      flatMap(async (response): ResultAsync<true, PaymentFailure> => {
        const parsed = CardPaymentResponseSchema.safeParse(response);
        if (parsed.success)
          return ok(true);
        logger.error('Failed to parse payment response:', { rawData: response, zodErrors: parsed.error.issues });
        return err(unexpected(parsed.error));
      }),
    );
  }

  return {
    pay,
    upgrade,
  };
}
