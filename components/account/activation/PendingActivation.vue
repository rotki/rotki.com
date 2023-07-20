<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div
    class="container py-16 lg:pt-[250px] lg:pb-32 flex flex-col items-center justify-center"
  >
    <div class="w-[500px] space-y-3">
      <div class="text-h4">{{ t('auth.pending_activation.title') }}</div>
      <div class="text-body-1 text-rui-text-secondary">
        {{ t('auth.pending_activation.message') }}
      </div>
    </div>
  </div>
</template>
