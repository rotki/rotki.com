<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.premium_defi.title') }}
    </template>

    {{ t('home.premium_features.features.premium_defi.detail') }}
  </PremiumFeature>
</template>
