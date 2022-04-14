<template>
  <premium-feature>
    <template #title>
      {{ $t('home.premium_features.features.premium_defi.title') }}
    </template>

    {{ $t('home.premium_features.features.premium_defi.detail') }}
  </premium-feature>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PremiumDefi',
})
</script>
