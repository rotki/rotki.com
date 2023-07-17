<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.graphs_and_statistics.title') }}
    </template>

    <I18nT
      keypath="home.premium_features.features.graphs_and_statistics.detail"
      scope="global"
    >
      <br />
    </I18nT>
  </PremiumFeature>
</template>
