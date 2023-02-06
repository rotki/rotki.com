<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.graphs_and_statistics.title') }}
    </template>

    <i18n-t
      keypath="home.premium_features.features.graphs_and_statistics.detail"
      scope="global"
    >
      <br />
    </i18n-t>
  </PremiumFeature>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
