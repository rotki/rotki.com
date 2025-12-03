<script setup lang="ts">
import { set } from '@vueuse/core';

const props = defineProps<{
  loading?: boolean;
  showRetry?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  back: [];
  retry: [];
}>();

const showError = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });

function handleRetry(): void {
  set(showError, false);
  emit('retry');
}

watch(() => props.error, (newError, oldError) => {
  if (!oldError && newError) {
    set(showError, true);
  }
}, { immediate: true });
</script>

<template>
  <div class="flex flex-col gap-4 justify-center w-full mt-auto pt-8">
    <!-- Loading state -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center min-h-[10rem]"
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
        <p class="text-center text-rui-text-secondary max-w-md">
          {{ t('subscription.payment.failure.message') }}
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
