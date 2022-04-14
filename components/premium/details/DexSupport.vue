<template>
  <premium-feature>
    <template #title>
      {{ $t('home.premium_features.features.dex_support.title') }}
    </template>

    <i18n path="home.premium_features.features.dex_support.detail">
      <br />
    </i18n>
  </premium-feature>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'DexSupport',
})
</script>
