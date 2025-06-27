<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="container">
    <div class="py-10 pb-20 md:pt-20 flex flex-col gap-4">
      <div class="text-rui-light-primary text-h6 font-medium">
        {{ t('pricing.header.heading') }}
      </div>
      <h4 class="text-h4 !font-bold">
        {{ t('pricing.header.title') }}
      </h4>
      <div class="max-w-[768px] text-body-1 text-rui-text-secondary">
        {{ t('pricing.header.description') }}
      </div>
    </div>
  </div>
</template>
