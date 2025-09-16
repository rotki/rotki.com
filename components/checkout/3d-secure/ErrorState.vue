<script setup lang="ts">
interface Props {
  error: string;
  canRetry: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  retry: [];
  back: [];
}>();

const { t } = useI18n({ useScope: 'global' });

function handleRetry() {
  emit('retry');
}

function handleBack() {
  emit('back');
}
</script>

<template>
  <div class="text-center py-12">
    <!-- Error icon -->
    <div class="mb-6">
      <RuiIcon
        name="lu-circle-alert"
        size="64"
        color="error"
        class="mx-auto"
      />
    </div>

    <!-- Error title -->
    <h2 class="text-2xl font-semibold mb-4 text-rui-error">
      {{ t('subscription.3d_secure.error_title') }}
    </h2>

    <!-- Error message -->
    <div class="bg-rui-error-lighter/10 border border-rui-error-lighter rounded-lg p-4 mb-6 max-w-md mx-auto">
      <p class="text-rui-error text-sm">
        {{ error }}
      </p>
    </div>

    <!-- Action buttons -->
    <div class="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
      <RuiButton
        variant="outlined"
        @click="handleBack()"
      >
        {{ t('actions.back') }}
      </RuiButton>

      <RuiButton
        v-if="canRetry"
        color="primary"
        @click="handleRetry()"
      >
        <template #prepend>
          <RuiIcon name="lu-refresh-cw" />
        </template>
        {{ t('actions.retry') }}
      </RuiButton>
    </div>

    <!-- Help text -->
    <div class="mt-8 text-sm text-rui-text-secondary">
      <p>{{ t('subscription.3d_secure.error_help') }}</p>
    </div>
  </div>
</template>
