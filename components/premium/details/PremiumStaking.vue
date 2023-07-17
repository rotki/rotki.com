<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.premium_staking.title') }}
    </template>

    <I18nT
      keypath="home.premium_features.features.premium_staking.detail"
      scope="global"
    >
      <br />
    </I18nT>
  </PremiumFeature>
</template>
