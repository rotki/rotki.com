<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <!-- Same heading pattern as the other marketing pages; the checkout stepper keeps its own step title -->
  <div class="flex flex-col items-center gap-3 text-center pt-6 lg:pt-10">
    <p class="text-rui-primary text-subtitle-1 font-medium">
      {{ t('pricing.page.eyebrow') }}
    </p>
    <h1 class="text-h4 md:text-h3 !font-bold text-rui-text text-balance">
      {{ t('pricing.page.title') }}
    </h1>
    <p class="text-body-1 text-rui-text-secondary max-w-[600px] text-balance">
      {{ t('pricing.page.description') }}
    </p>
  </div>
</template>
