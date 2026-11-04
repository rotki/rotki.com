<script setup lang="ts">
import { set } from '@vueuse/shared';

const { loading, showRetry, error } = defineProps<{
  loading?: boolean;
  showRetry?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  back: [];
  retry: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const showError = ref<boolean>(false);

function handleRetry(): void {
  set(showError, false);
  emit('retry');
}

watch(() => error, (newError, oldError) => {
  if (!oldError && newError) {
    set(showError, true);
  }
}, { immediate: true });
</script>

<template>
  <div class="flex flex-col gap-4 justify-center w-full grow pt-8">
    <!-- Loading state -->
    <!-- As tall as the screen: the payment page that follows is taller, so the footer stays below the fold. -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center min-h-svh"
      data-cy="crypto-payment-loading"
    >
      <RuiProgress
        variant="indeterminate"
        size="48"
        circular
        color="primary"
        class="mb-4"
      />
      <p class="text-rui-text-secondary">
        {{ t('common.loading') }}
      </p>
    </div>

    <template v-else-if="showError">
      <div class="flex flex-col items-center justify-center mb-6">
        <RuiIcon
          name="lu-circle-x"
          size="64"
          class="text-rui-error mb-4"
        />
        <h3 class="text-xl font-semibold text-rui-text mb-2">
          {{ t('subscription.payment.failure.title') }}
        </h3>
        <p
          role="alert"
          class="text-center text-rui-text-secondary max-w-md"
          data-cy="crypto-payment-error"
        >
          {{ error || t('subscription.payment.failure.message') }}
        </p>
      </div>

      <div
        v-if="showRetry"
        class="flex justify-center mb-4"
      >
        <RuiButton
          color="primary"
          size="lg"
          @click="handleRetry()"
        >
          <template #prepend>
            <RuiIcon
              name="lu-refresh-cw"
              size="16"
            />
          </template>
          {{ t('actions.try_again') }}
        </RuiButton>
      </div>

      <div class="flex gap-4 justify-center w-full">
        <RuiButton
          size="lg"
          @click="$emit('back')"
        >
          <template #prepend>
            <RuiIcon
              name="lu-arrow-left"
              size="16"
            />
          </template>
          {{ t('actions.back') }}
        </RuiButton>
      </div>
    </template>
  </div>
</template>
