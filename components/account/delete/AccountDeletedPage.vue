<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div
    class="container h-full flex flex-col pt-10 md:pt-0 md:flex-1 md:items-center md:justify-center"
  >
    <div class="max-w-[380px] max-w-full space-y-3">
      <div class="text-h4">
        {{ t('account.account_deleted.title') }}
      </div>
      <div class="text-body-1 text-rui-text-secondary">
        {{ t('account.account_deleted.message') }}
      </div>
    </div>
  </div>
</template>
