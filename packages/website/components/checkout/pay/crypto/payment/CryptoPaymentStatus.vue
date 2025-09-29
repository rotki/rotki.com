<script setup lang="ts">
import type { PaymentStep } from '~/types';

defineProps<{
  status: PaymentStep;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <!-- Success state -->
  <div
    v-if="status.type === 'success'"
    class="flex flex-col items-center justify-center py-8 text-center"
  >
    <div class="mb-4 p-3 rounded-full bg-green-100 dark:bg-green-900/20">
      <RuiIcon
        name="lu-check-circle"
        class="text-green-600 dark:text-green-400"
        size="48"
      />
    </div>
    <h3 class="text-xl font-semibold text-rui-text mb-2">
      {{ t('subscription.success.payment_successful') }}
    </h3>
    <p class="text-rui-text-secondary">
      {{ t('subscription.success.redirecting') }}
    </p>
  </div>

  <!-- Pending state -->
  <div
    v-else-if="status.type === 'pending'"
    class="flex flex-col items-center justify-center py-8 text-center"
  >
    <div class="mb-4">
      <RuiProgress
        variant="indeterminate"
        size="48"
        circular
        color="primary"
      />
    </div>
    <h3 class="text-lg font-medium text-rui-text mb-2">
      {{ status.title }}
    </h3>
    <p class="text-rui-text-secondary">
      {{ status.message }}
    </p>
  </div>

  <!-- Error state (handled by PaymentFrame, but can add visual feedback here) -->
  <div
    v-else-if="status.type === 'failure'"
    class="flex flex-col items-center justify-center py-4 text-center"
  >
    <div class="mb-3 p-2 rounded-full bg-red-100 dark:bg-red-900/20">
      <RuiIcon
        name="lu-alert-circle"
        class="text-red-600 dark:text-red-400"
        size="32"
      />
    </div>
    <p class="text-sm text-rui-text-secondary">
      {{ t('subscription.error.check_details_and_retry') }}
    </p>
  </div>
</template>
