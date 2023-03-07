<script setup lang="ts">
const { t } = useI18n();
</script>
<template>
  <PremiumFeature>
    <template #title>
      {{ t('home.premium_features.features.premium_staking.title') }}
    </template>

    <i18n-t
      keypath="home.premium_features.features.premium_staking.detail"
      scope="global"
    >
      <br />
    </i18n-t>
  </PremiumFeature>
</template>
