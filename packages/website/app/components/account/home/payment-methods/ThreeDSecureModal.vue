<script setup lang="ts">
import type { Subscription } from '@rotki/card-payment-common/schemas/subscription';
import { parseBraintreeError } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import ThreeDSecureBillingInfo from '~/components/account/home/payment-methods/ThreeDSecureBillingInfo.vue';
import { useCardThreeDSecure } from '~/modules/checkout/composables/use-card-three-d-secure';
import { usePaymentErrorMessage } from '~/modules/checkout/composables/use-payment-error-message';

export interface ThreeDSecureVerificationData {
  cardToken: string;
  /** Identifies the card in the Braintree vault, which holds all of them. */
  cardLast4: string;
  /** Disambiguates two vault entries that share a last four. */
  cardExpiresAt: string;
  subscriptionData: Pick<Subscription, 'nextBillingAmount' | 'nextActionDate' | 'durationInMonths'>;
}

const model = defineModel<boolean>({ required: true });

const { verificationData, isReauthorization } = defineProps<{
  verificationData: ThreeDSecureVerificationData;
  isReauthorization?: boolean;
}>();

const emit = defineEmits<{
  success: [];
  error: [error: Error];
}>();

const { t } = useI18n({ useScope: 'global' });

const verifying = ref<boolean>(false);
const challengeShown = ref<boolean>(false);
const errorMessage = ref<string>();

const { verifyAndSetDefaultCard, teardown } = useCardThreeDSecure();
const { userMessageFor } = usePaymentErrorMessage();

function close(): void {
  set(model, false);
}

/** Closes the modal, unless verification is running and no challenge is visible yet. */
function handleCancel(): void {
  if (get(verifying) && !get(challengeShown)) {
    return;
  }
  teardown();
  close();
}

function handleChallengeRequired(): void {
  set(challengeShown, true);
}

function handleVerificationComplete(): void {
  set(challengeShown, false);
}

async function startVerification(): Promise<void> {
  set(verifying, true);
  set(challengeShown, false);
  set(errorMessage, undefined);

  try {
    const { cardToken, cardLast4, cardExpiresAt, subscriptionData: { nextBillingAmount } } = verificationData;
    await verifyAndSetDefaultCard({
      cardToken,
      cardLast4,
      cardExpiresAt,
      amount: nextBillingAmount,
      onChallengeRequired: handleChallengeRequired,
      onVerificationComplete: handleVerificationComplete,
    });

    emit('success');
    close();
  }
  catch (error: unknown) {
    set(errorMessage, userMessageFor(parseBraintreeError(error), 'card'));
    emit('error', error instanceof Error ? error : new Error(String(error)));
  }
  finally {
    set(verifying, false);
  }
}

// Start verification when modal opens
watch(model, (isOpen) => {
  if (isOpen) {
    startVerification();
  }
  else {
    // Cleanup when modal closes
    teardown();
  }
}, { immediate: true });
</script>

<template>
  <RuiDialog
    v-model="model"
    :persistent="verifying"
    max-width="600"
  >
    <RuiCard>
      <template #header>
        {{ t('payment_methods.three_d_secure.title') }}
      </template>

      <div class="flex flex-col gap-4">
        <!-- Info message -->
        <RuiAlert
          v-if="!errorMessage"
          type="info"
        >
          {{ t('payment_methods.three_d_secure.verification_message') }}
        </RuiAlert>

        <!-- Billing details message -->
        <RuiAlert
          v-if="!errorMessage"
          type="warning"
        >
          <ThreeDSecureBillingInfo
            :subscription-data="verificationData.subscriptionData"
            :is-reauthorization="isReauthorization"
          />
        </RuiAlert>

        <!-- Error message -->
        <RuiAlert
          v-if="errorMessage"
          type="error"
        >
          {{ errorMessage }}
        </RuiAlert>

        <!-- Loading state -->
        <div
          v-if="verifying && !challengeShown && !errorMessage"
          class="flex items-center justify-center min-h-[400px] w-full"
        >
          <RuiProgress
            circular
            variant="indeterminate"
            color="primary"
            size="48"
          />
        </div>

        <!-- 3D Secure iframe container -->
        <div
          v-show="challengeShown"
          id="threeds-iframe-container"
          class="min-h-[400px] w-full"
        />
      </div>

      <template #footer>
        <div class="flex gap-2 justify-end w-full">
          <RuiButton
            variant="text"
            :disabled="verifying && !challengeShown"
            @click="handleCancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>
