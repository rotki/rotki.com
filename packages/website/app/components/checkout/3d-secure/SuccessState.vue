<script setup lang="ts">
const emit = defineEmits<{
  'go-to-dashboard': [];
}>();

const { t } = useI18n({ useScope: 'global' });

function handleGoToDashboard() {
  emit('go-to-dashboard');
}
</script>

<template>
  <div class="text-center py-12">
    <!-- Success icon -->
    <div class="mb-6">
      <RuiIcon
        name="lu-circle-check"
        size="64"
        color="success"
        class="mx-auto"
      />
    </div>

    <!-- Success title -->
    <h4 class="text-h4 mb-3">
      {{ t('subscription.success.title') }}
    </h4>

    <p class="text-body-1 text-rui-text-secondary mb-8 max-w-md mx-auto">
      {{ t('subscription.success.message') }}
    </p>

    <!-- Manage Premium button -->
    <RuiButton
      class="w-full max-w-sm mx-auto"
      color="primary"
      @click="handleGoToDashboard()"
    >
      {{ t('page_header.manage_premium') }}
    </RuiButton>

    <!-- Success notice with setup link -->
    <p class="text-xs text-rui-text-secondary mt-4">
      {{ t('subscription.3d_secure.payment_complete_notice') }}
      <NuxtLink
        to="https://docs.rotki.com/usage-guides/#set-up-rotki-premium"
        external
        target="_blank"
        class="text-rui-primary underline hover:text-rui-primary-darker"
      >
        {{ t('subscription.3d_secure.setup_guide') }}
      </NuxtLink>
      {{ t('subscription.3d_secure.get_started_text') }}
    </p>
  </div>
</template>
