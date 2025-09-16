<script setup lang="ts">
const emit = defineEmits<{
  'back-to-selection': [];
}>();

const { t } = useI18n({ useScope: 'global' });

function handleBackToSelection() {
  emit('back-to-selection');
}
</script>

<template>
  <div class="text-center py-12">
    <!-- Warning icon -->
    <div class="mb-6">
      <RuiIcon
        name="lu-triangle-alert"
        size="64"
        color="warning"
        class="mx-auto"
      />
    </div>

    <!-- Title -->
    <h2 class="text-2xl font-semibold mb-4 text-rui-warning">
      {{ t('subscription.3d_secure.invalid_params_title') }}
    </h2>

    <!-- Message -->
    <p class="text-rui-text-secondary mb-8 max-w-md mx-auto">
      {{ t('subscription.3d_secure.invalid_params_message') }}
    </p>

    <!-- Possible causes -->
    <div class="bg-rui-warning-lighter/10 border border-rui-warning-lighter rounded-lg p-4 mb-8 max-w-md mx-auto text-left">
      <h3 class="font-medium text-sm mb-2 text-rui-warning">
        {{ t('subscription.3d_secure.possible_causes') }}:
      </h3>
      <ul class="text-sm text-rui-text-secondary space-y-1">
        <li class="flex items-start gap-2">
          <RuiIcon
            name="lu-circle"
            size="4"
            class="mt-1.5 text-rui-warning"
          />
          {{ t('subscription.3d_secure.cause_direct_access') }}
        </li>
        <li class="flex items-start gap-2">
          <RuiIcon
            name="lu-circle"
            size="4"
            class="mt-1.5 text-rui-warning"
          />
          {{ t('subscription.3d_secure.cause_expired_session') }}
        </li>
        <li class="flex items-start gap-2">
          <RuiIcon
            name="lu-circle"
            size="4"
            class="mt-1.5 text-rui-warning"
          />
          {{ t('subscription.3d_secure.cause_browser_refresh') }}
        </li>
      </ul>
    </div>

    <!-- Action button -->
    <RuiButton
      color="primary"
      size="lg"
      @click="handleBackToSelection()"
    >
      <template #prepend>
        <RuiIcon name="lu-arrow-left" />
      </template>
      {{ t('subscription.3d_secure.back_to_payment_selection') }}
    </RuiButton>
  </div>
</template>
