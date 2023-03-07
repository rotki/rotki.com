<script setup lang="ts">
const { t } = useI18n();
</script>
<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.history.title') }}
    </template>

    {{ t('home.premium_features.features.history.detail') }}
  </PremiumFeature>
</template>
