import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { Client } from 'braintree-web/client';
import { saveThreeDSecureHandoff } from '@rotki/card-payment-common/utils/three-d-secure-handoff';
import { get, set } from '@vueuse/core';
import { type MaybeRefOrGetter, type Ref, shallowReadonly, shallowRef, toValue } from 'vue';
import { addCard, CardAddedPaymentError, createCardNonce, reportCardFailure, trackCardPaymentSubmitted } from '@/utils/card-api';
import { findSavedCardBin } from '@/utils/saved-card-bin';
import { buildThreeDSecureParams } from '@/utils/three-d-secure-handoff';

export interface TokenizedCard {
  nonce: string;
  bin: string;
}

export interface CardCheckoutOptions {
  plan: MaybeRefOrGetter<SelectedPlan>;
  upgradeSubId: MaybeRefOrGetter<string | undefined>;
  clientToken: MaybeRefOrGetter<string | undefined>;
  breakdown: MaybeRefOrGetter<PaymentBreakdownResponse | undefined>;
  discountCode: MaybeRefOrGetter<string>;
  /** The Braintree client, used to read a saved card's BIN from the vault. */
  client: MaybeRefOrGetter<Client | undefined>;
  /** Tokenizes the new card form; `undefined` when the form is not mounted. */
  tokenizeNewCard: () => Promise<TokenizedCard | undefined>;
  /** A new card was vaulted, so the saved card list is stale. */
  onCardSaved: () => void;
  /** The payment is handed to the 3D Secure page. */
  onHandoff: () => void;
}

export interface UseCardCheckoutReturn {
  processing: Readonly<Ref<boolean>>;
  /** Per-payment error shown above the card. */
  transactionError: Readonly<Ref<string | undefined>>;
  /** Shows an error from the card form or dialogs, or dismisses it with `undefined`. */
  setTransactionError: (message: string | undefined) => void;
  submit: (card: SavedCard | undefined) => Promise<void>;
}

const NOT_READY = 'The payment form is not ready. Reload the page and try again.';

/**
 * Submits a card payment: vaults a new card or reads the saved card's BIN, creates the
 * payment nonce and hands everything to the website's 3D Secure page. The charge itself
 * happens there, after the bank has confirmed.
 */
export function useCardCheckout(options: CardCheckoutOptions): UseCardCheckoutReturn {
  const processing = shallowRef<boolean>(false);
  const transactionError = shallowRef<string>();

  async function resolveCard(card: SavedCard | undefined): Promise<{ token: string; bin: string } | undefined> {
    if (card)
      return { token: card.token, bin: await findSavedCardBin(toValue(options.client), card) };

    const tokenized = await options.tokenizeNewCard();
    if (!tokenized)
      return undefined;

    const token = await addCard({ paymentMethodNonce: tokenized.nonce });
    options.onCardSaved();
    return { token, bin: tokenized.bin };
  }

  async function submit(card: SavedCard | undefined): Promise<void> {
    if (get(processing))
      return;

    const clientToken = toValue(options.clientToken);
    if (!clientToken) {
      set(transactionError, NOT_READY);
      return;
    }

    const plan = toValue(options.plan);
    const upgradeSubId = toValue(options.upgradeSubId);
    const breakdown = toValue(options.breakdown);
    const cardType = card ? 'saved' as const : 'new' as const;
    const discountApplied = breakdown?.discount?.isValid === true;

    set(processing, true);
    set(transactionError, undefined);

    trackCardPaymentSubmitted({
      planId: plan.planId,
      durationInMonths: plan.durationInMonths,
      isUpgrade: !!upgradeSubId,
      cardType,
      discountApplied,
    });

    try {
      const resolved = await resolveCard(card);
      if (!resolved) {
        set(transactionError, NOT_READY);
        set(processing, false);
        return;
      }

      const nonce = await createCardNonce({ paymentToken: resolved.token });
      saveThreeDSecureHandoff(buildThreeDSecureParams({
        clientToken,
        nonce,
        bin: resolved.bin,
        plan,
        breakdown,
        discountCode: toValue(options.discountCode),
        upgradeSubId,
      }));
      // Stays processing: the page is about to navigate away.
      options.onHandoff();
    }
    catch (error) {
      if (error instanceof CardAddedPaymentError)
        options.onCardSaved();

      set(transactionError, reportCardFailure(error, {
        failure: 'CARD_PAYMENT_API_ERROR',
        planId: plan.planId,
        isUpgrade: !!upgradeSubId,
        step: 'submit',
        cardType,
        discountApplied,
      }));
      set(processing, false);
    }
  }

  return {
    processing: shallowReadonly(processing),
    transactionError: shallowReadonly(transactionError),
    setTransactionError: (message: string | undefined): void => set(transactionError, message),
    submit,
  };
}
