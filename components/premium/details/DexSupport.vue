<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.dex_support.title') }}
    </template>

    <I18nT
      keypath="home.premium_features.features.dex_support.detail"
      scope="global"
    >
      <br />
    </I18nT>
  </PremiumFeature>
</template>
