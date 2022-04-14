<template>
  <premium-feature>
    <template #title>
      {{ $t('home.premium_features.features.history.title') }}
    </template>

    {{ $t('home.premium_features.features.history.detail') }}
  </premium-feature>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Transactions',
})
</script>
