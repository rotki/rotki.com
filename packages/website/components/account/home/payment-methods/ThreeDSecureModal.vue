<script setup lang="ts">
import type { Subscription } from '@rotki/card-payment-common/schemas/subscription';
import { get, set } from '@vueuse/core';
import { useCardThreeDSecure } from '~/composables/use-card-three-d-secure';
import { formatDate } from '~/utils/date';
import { formatCurrency } from '~/utils/text';

export interface ThreeDSecureVerificationData {
  cardToken: string;
  subscriptionData: Pick<Subscription, 'nextBillingAmount' | 'nextActionDate' | 'durationInMonths'>;
}

interface Props {
  verificationData: ThreeDSecureVerificationData;
  isReauthorization?: boolean;
}

interface Emits {
  success: [];
  error: [error: Error];
}

const model = defineModel<boolean>({ required: true });

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { t } = useI18n({ useScope: 'global' });

const { verifyAndSetDefaultCard, teardown } = useCardThreeDSecure();

const verifying = ref<boolean>(false);
const challengeShown = ref<boolean>(false);
const errorMessage = ref<string>();

const billingPeriod = computed<string>(() => {
  const { durationInMonths } = props.verificationData.subscriptionData;
  return durationInMonths === 12
    ? t('common.yearly')
    : t('common.monthly');
});

function close(): void {
  set(model, false);
}

function handleCancel(): void {
  // Allow cancel only when challenge is visible or when not verifying
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
    const { cardToken, subscriptionData: { nextBillingAmount } } = props.verificationData;
    await verifyAndSetDefaultCard(
      cardToken,
      nextBillingAmount,
      handleChallengeRequired,
      handleVerificationComplete,
    );

    emit('success');
    close();
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : t('common.error_occurred');
    set(errorMessage, message);
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
          <div class="flex flex-col gap-2">
            <div class="font-medium">
              {{ t('payment_methods.three_d_secure.billing_info_title') }}
            </div>
            <div>
              {{ t(isReauthorization ? 'payment_methods.three_d_secure.billing_info_reauth' : 'payment_methods.three_d_secure.billing_info_replace') }}
              <i18n-t
                keypath="payment_methods.three_d_secure.billing_info_schedule"
                tag="span"
              >
                <template #date>
                  <span class="font-medium">{{ formatDate(verificationData.subscriptionData.nextActionDate) }}</span>
                </template>
                <template #amount>
                  <span class="font-medium">{{ formatCurrency(verificationData.subscriptionData.nextBillingAmount) }}</span>
                </template>
                <template #period>
                  <span class="font-medium">{{ billingPeriod }}</span>
                </template>
              </i18n-t>
            </div>
          </div>
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
