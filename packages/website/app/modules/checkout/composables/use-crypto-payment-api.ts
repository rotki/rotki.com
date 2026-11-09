import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { CheckoutPaymentMethods, CheckoutSteps, PaymentServerEvents } from '@rotki/sigil';
import { FetchError } from 'ofetch';
import { pipe } from 'plainfp/pipe';
import { flatMap, fromPromise, type ResultAsync } from 'plainfp/result-async';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { parseApiResult, type PaymentFailure, toPaymentFailure } from '~/modules/checkout/utils/payment-failure';
import {
  type CryptoPayment,
  CryptoPaymentResponse,
  type CryptoUpgradePayment,
  CryptoUpgradePaymentResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
} from '~/types';
import { nonEmpty } from '~/utils/non-empty';
import { useLogger } from '~/utils/use-logger';

/**
 * Parameters for crypto payment (purchase/renewal)
 */
export interface CryptoPaymentParams {
  planId: number;
  cryptocurrencyIdentifier: string;
  subscriptionId?: string;
  discountCode?: string;
}

/**
 * Parameters for crypto upgrade payment
 */
export interface CryptoUpgradePaymentParams {
  planId: number;
  cryptocurrencyIdentifier: string;
  subscriptionId: string;
  discountCode?: string;
}

interface UseCryptoPaymentApiReturn {
  checkPendingCryptoPayment: (subscriptionId?: string) => ResultAsync<PendingCryptoPayment, PaymentFailure>;
  checkCryptoUpgradePayment: (subscriptionId?: string) => ResultAsync<CryptoUpgradePayment, PaymentFailure>;
  cryptoPayment: (params: CryptoPaymentParams) => ResultAsync<CryptoPayment, PaymentFailure>;
  deletePendingPayment: () => ResultAsync<boolean, PaymentFailure>;
  markTransactionStarted: (isUpgrade: boolean) => ResultAsync<boolean, PaymentFailure>;
  switchCryptoPlan: (params: CryptoPaymentParams) => ResultAsync<CryptoPayment, PaymentFailure>;
  switchCryptoUpgradePlan: (params: CryptoUpgradePaymentParams) => ResultAsync<CryptoPayment, PaymentFailure>;
  cancelUpgradeRequest: (subscriptionId: string) => ResultAsync<boolean, PaymentFailure>;
  upgradeCryptoSubscription: (params: CryptoUpgradePaymentParams) => ResultAsync<CryptoPayment, PaymentFailure>;
}

/**
 * A 409 on delete means nothing is pending, which is the state we wanted, so it counts as a success
 * instead of blocking the user (e.g. Back after a failed payment creation).
 */
function nothingPendingIsDeleted(error: unknown): { result: boolean } {
  if (error instanceof FetchError && error.statusCode === 409)
    return { result: true };
  throw error;
}

/**
 * Crypto payment API composable
 * Handles all crypto payment-related API operations
 */
export function useCryptoPaymentApi(): UseCryptoPaymentApiReturn {
  const logger = useLogger('crypto-payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { logPaymentEvent } = usePaymentLogger();

  /** Logs what a call threw, with the detail the failure itself leaves out, and sorts it. */
  function onThrown(label: string): (cause: unknown) => PaymentFailure {
    return (cause) => {
      logger.error(label, cause);
      return toPaymentFailure(cause);
    };
  }

  /** {@link onThrown} for the calls that create a payment, which also report to the payment log. */
  function onCreateThrown(cause: any): PaymentFailure {
    logPaymentEvent({
      paymentMethod: CheckoutPaymentMethods.CRYPTO,
      event: PaymentServerEvents.CRYPTO_PAYMENT_API_ERROR,
      errorMessage: nonEmpty(cause?.message) ?? 'unknown',
      errorCode: String(cause?.statusCode ?? ''),
      step: CheckoutSteps.SUBMIT,
    });
    return onThrown('Crypto payment failed:')(cause);
  }

  /**
   * Create crypto payment request
   */
  async function cryptoPayment(params: CryptoPaymentParams): ResultAsync<CryptoPayment, PaymentFailure> {
    const { planId, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/crypto/payments', {
        body: convertKeys({ cryptocurrencyIdentifier, planId, subscriptionId, discountCode }, false, false),
        method: 'POST',
        retry: false,
      }), onCreateThrown),
      flatMap(parseApiResult(CryptoPaymentResponse)),
    );
  }

  async function upgradeCryptoSubscription(params: CryptoUpgradePaymentParams): ResultAsync<CryptoPayment, PaymentFailure> {
    const { planId, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/crypto/upgrade', {
        body: { cryptocurrencyIdentifier, planId, subscriptionId, discountCode },
        method: 'POST',
        retry: false,
      }), onCreateThrown),
      flatMap(parseApiResult(CryptoPaymentResponse)),
    );
  }

  async function checkCryptoUpgradePayment(subscriptionId?: string): ResultAsync<CryptoUpgradePayment, PaymentFailure> {
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/crypto/payment/upgrade/', {
        query: convertKeys({ subscriptionId }, false, false),
      }), onThrown('Failed to check crypto upgrade payment:')),
      flatMap(parseApiResult(CryptoUpgradePaymentResponse)),
    );
  }

  /**
   * Check pending crypto payment status
   */
  async function checkPendingCryptoPayment(subscriptionId?: string): ResultAsync<PendingCryptoPayment, PaymentFailure> {
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/crypto/payment/pending/', {
        query: convertKeys({ subscriptionId }, false, false),
      }), onThrown('Failed to check pending crypto payment:')),
      flatMap(parseApiResult(PendingCryptoPaymentResponse)),
    );
  }

  /**
   * Mark crypto payment transaction as started
   */
  async function markTransactionStarted(isUpgrade: boolean): ResultAsync<boolean, PaymentFailure> {
    return pipe(
      fromPromise(fetchWithCsrf<unknown>(
        isUpgrade ? '/webapi/2/crypto/payment/upgrade/' : '/webapi/2/crypto/payment/pending/',
        { method: 'PATCH' },
      ), onThrown('Failed to mark transaction as started:')),
      flatMap(parseApiResult(ActionResultResponseSchema)),
    );
  }

  /**
   * Delete pending crypto payment
   */
  async function deletePendingPayment(): ResultAsync<boolean, PaymentFailure> {
    const request = fetchWithCsrf<unknown>('/webapi/2/crypto/payment/pending/', { method: 'DELETE' }).catch(nothingPendingIsDeleted);
    return pipe(
      fromPromise(request, onThrown('Failed to delete pending payment:')),
      flatMap(parseApiResult(ActionResultResponseSchema)),
    );
  }

  /**
   * Switch crypto payment plan (delete current and create new)
   */
  async function switchCryptoPlan(params: CryptoPaymentParams): ResultAsync<CryptoPayment, PaymentFailure> {
    return pipe(deletePendingPayment(), flatMap(async () => cryptoPayment(params)));
  }

  async function cancelUpgradeRequest(subscriptionId: string): ResultAsync<boolean, PaymentFailure> {
    return pipe(
      fromPromise(fetchWithCsrf<unknown>('/webapi/2/crypto/upgrade/cancel', {
        body: { subscriptionId },
        method: 'POST',
      }), onThrown('Failed to cancel upgrade request:')),
      flatMap(parseApiResult(ActionResultResponseSchema)),
    );
  }

  /**
   * Switch crypto upgrade plan (cancel current upgrade and create new)
   */
  async function switchCryptoUpgradePlan(params: CryptoUpgradePaymentParams): ResultAsync<CryptoPayment, PaymentFailure> {
    return pipe(cancelUpgradeRequest(params.subscriptionId), flatMap(async () => upgradeCryptoSubscription(params)));
  }

  return {
    cancelUpgradeRequest,
    checkCryptoUpgradePayment,
    checkPendingCryptoPayment,
    cryptoPayment,
    deletePendingPayment,
    markTransactionStarted,
    switchCryptoPlan,
    switchCryptoUpgradePlan,
    upgradeCryptoSubscription,
  };
}
