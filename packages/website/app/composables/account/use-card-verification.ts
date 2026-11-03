import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { Ref } from 'vue';
import type { CardVerificationData } from '~/types/payment';
import { PaymentProvider } from '@rotki/card-payment-common/schemas/subscription';
import { parseBraintreeError } from '@rotki/sigil';
import { objectPick } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { usePaymentErrorMessage } from '~/modules/checkout/composables/use-payment-error-message';
import { useLogger } from '~/utils/use-logger';

/** Why a saved card goes through 3-D Secure: to become the renewal card, or to renew its authorization. */
export const CardVerificationMode = {
  LINK: 'link',
  REAUTHORIZE: 'reauthorize',
} as const;

export type CardVerificationModeType = typeof CardVerificationMode[keyof typeof CardVerificationMode];

/** How each mode reads in the logs. */
const modeLogName: Record<CardVerificationModeType, string> = {
  [CardVerificationMode.LINK]: 'card verification',
  [CardVerificationMode.REAUTHORIZE]: 'reauthorization',
};

export interface CardVerificationError {
  title: string;
  message: string;
}

interface UseCardVerificationOptions {
  /** Runs once the dialog verified the card, to reload the cards and subscriptions. */
  onVerified: () => Promise<void>;
  /** Gets the message to show when the card cannot be verified. */
  onError: (error: CardVerificationError) => void;
}

interface UseCardVerificationReturn {
  /** The token of the card in the dialog, so its row can show it is busy. */
  verifyingToken: Readonly<Ref<string | undefined>>;
  /** The data the dialog verifies, set while it is open. */
  verificationData: Readonly<Ref<CardVerificationData | undefined>>;
  isReauthorization: Readonly<Ref<boolean>>;
  /** The dialog's v-model. */
  modelDialogOpen: Ref<boolean>;
  start: (card: SavedCard, mode: CardVerificationModeType) => void;
  handleVerified: () => Promise<void>;
  handleFailed: (error: Error) => void;
}

/**
 * Puts a saved card through 3-D Secure for the active subscription, to link it for renewals or to
 * re-authorize it. Crypto subscriptions and accounts without a subscription cannot use a card.
 */
export function useCardVerification({ onVerified, onError }: UseCardVerificationOptions): UseCardVerificationReturn {
  const { t } = useI18n({ useScope: 'global' });
  const logger = useLogger('payment-methods');
  const { userMessageFor } = usePaymentErrorMessage();
  const { activeSubscription } = useUserSubscriptions();

  const mode = shallowRef<CardVerificationModeType>();
  const verificationData = shallowRef<CardVerificationData>();
  const modelDialogOpen = shallowRef<boolean>(false);

  const isReauthorization = computed<boolean>(() => get(mode) === CardVerificationMode.REAUTHORIZE);
  const verifyingToken = computed<string | undefined>(() => get(verificationData)?.cardToken);

  function fail(message: string): void {
    onError({ message, title: t('common.error') });
  }

  function start(card: SavedCard, nextMode: CardVerificationModeType): void {
    set(mode, nextMode);
    const active = get(activeSubscription);
    if (!active) {
      logger.error(`No active subscription found for 3DS ${modeLogName[nextMode]}`);
      fail(t('home.account.payment_methods.no_active_subscription'));
      return;
    }

    if (active.paymentProvider === PaymentProvider.CRYPTO) {
      logger.error(`Cannot perform ${modeLogName[nextMode]} on crypto subscription`);
      fail(t('home.account.payment_methods.crypto_subscription_no_card_operations'));
      return;
    }

    set(verificationData, {
      cardExpiresAt: card.expiresAt,
      cardLast4: card.last4,
      cardToken: card.token,
      subscriptionData: objectPick(active, ['nextBillingAmount', 'nextActionDate', 'durationInMonths']),
    });
    set(modelDialogOpen, true);
  }

  function close(): void {
    set(modelDialogOpen, false);
    set(verificationData, undefined);
  }

  async function handleVerified(): Promise<void> {
    close();
    await onVerified();
  }

  function handleFailed(error: Error): void {
    logger.error('3DS verification failed:', error);
    fail(userMessageFor(parseBraintreeError(error), 'card'));
    close();
  }

  return {
    handleFailed,
    handleVerified,
    isReauthorization,
    modelDialogOpen,
    start,
    verificationData: shallowReadonly(verificationData),
    verifyingToken,
  };
}
