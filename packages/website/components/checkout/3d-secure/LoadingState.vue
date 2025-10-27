<script setup lang="ts">
import type { PaymentInfo, ThreeDSecureState } from '@rotki/card-payment-common/schemas/three-d-secure';
import PaymentInfoCard from '~/components/checkout/3d-secure/PaymentInfoCard.vue';

interface Props {
  state: ThreeDSecureState;
  challengeVisible: boolean;
  paymentInfo: PaymentInfo | undefined;
}

const { state, challengeVisible, paymentInfo } = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const loadingMessages = computed<Record<ThreeDSecureState, string>>(() => ({
  'initializing': t('subscription.3d_secure.initializing'),
  'ready': t('subscription.3d_secure.ready'),
  'verifying': t('subscription.3d_secure.verifying'),
  'challenge-active': t('subscription.3d_secure.challenge_active'),
  'success': t('subscription.3d_secure.success'),
  'error': t('subscription.3d_secure.error'),
}));
</script>

<template>
  <div class="flex flex-col gap-8 xl:grid xl:grid-cols-[1.5fr_1fr] xl:gap-12 xl:items-start">
    <!-- Payment Information - First on mobile, Right on desktop -->
    <aside class="w-full xl:sticky xl:top-8 xl:self-start xl:order-2">
      <PaymentInfoCard
        v-if="paymentInfo"
        :payment-info="paymentInfo"
      />
    </aside>

    <!-- 3D Secure Challenge - Second on mobile, Left on desktop -->
    <div class="flex flex-col min-w-0 xl:order-1">
      <!-- Loading indicator for non-challenge states -->
      <div
        v-if="!challengeVisible"
        class="flex flex-col items-center justify-center min-h-[300px]"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
          class="my-4"
        />

        <p class="text-rui-text-secondary text-center max-w-md">
          {{ loadingMessages[state] }}
        </p>

        <!-- Security notice -->
        <div class="mt-6 text-xs text-rui-text-secondary text-center max-w-sm">
          <RuiIcon
            name="lu-lock"
            size="12"
            class="inline mr-1"
          />
          {{ t('subscription.3d_secure.security_notice') }}
        </div>
      </div>

      <!-- Challenge iframe container - Always in DOM, visibility controlled -->
      <div
        v-show="challengeVisible"
        class="w-full flex flex-col"
      >
        <div class="mb-4">
          <RuiAlert
            type="info"
            variant="outlined"
            icon="lu-shield-check"
          >
            <span class="font-medium">
              {{ t('subscription.3d_secure.challenge_instructions') }}
            </span>
          </RuiAlert>
        </div>

        <!-- iframe container - Always in DOM -->
        <div
          id="threeds-iframe-container"
          class="w-full [&>div]:w-full [&_iframe]:w-full"
        />
      </div>
    </div>
  </div>
</template>
