<script setup lang="ts">
import type { ThreeDSecureState } from '@rotki/card-payment-common/schemas/three-d-secure';

interface Props {
  state: ThreeDSecureState;
  challengeVisible: boolean;
}

defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const loadingMessages = computed(() => ({
  'initializing': t('subscription.3d_secure.initializing'),
  'ready': t('subscription.3d_secure.ready'),
  'verifying': t('subscription.3d_secure.verifying'),
  'challenge-active': t('subscription.3d_secure.challenge_active'),
  'success': t('subscription.3d_secure.success'),
  'error': t('subscription.3d_secure.error'),
}));
</script>

<template>
  <div class="flex flex-col items-center justify-center py-8">
    <!-- Loading indicator for non-challenge states -->
    <div
      v-if="!challengeVisible"
      class="flex flex-col items-center"
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
      class="w-full max-w-2xl mx-auto flex flex-col items-center"
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
      <div id="threeds-iframe-container" />
    </div>
  </div>
</template>
