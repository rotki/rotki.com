<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div
    class="container py-16 lg:pt-[250px] lg:pb-32 flex flex-col items-center justify-center"
  >
    <div class="w-[360px] max-w-full space-y-8">
      <div class="space-y-3">
        <div class="text-h4">{{ t('auth.password_changed.title') }}</div>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('auth.password_changed.message') }}
        </div>
      </div>
      <ButtonLink
        color="primary"
        variant="default"
        class="w-full"
        size="lg"
        to="/home/subscription"
      >
        {{ t('actions.continue') }}
      </ButtonLink>
    </div>
  </div>
</template>
