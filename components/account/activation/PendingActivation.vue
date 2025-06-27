<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div
    class="container h-full flex flex-col pt-10 md:pt-0 md:flex-1 md:items-center md:justify-center"
  >
    <div class="w-[30.6rem] max-w-full space-y-3">
      <div class="text-h4">
        {{ t('auth.pending_activation.title') }}
      </div>
      <div class="text-body-1 text-rui-text-secondary">
        {{ t('auth.pending_activation.message') }}
      </div>
    </div>
  </div>
</template>
