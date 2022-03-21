<template>
  <plan :action="$tc('actions.get_premium_plan')" url="/products/">
    <template #title>{{ $t('home.plans.details.premium.title') }}</template>
    {{ $t('home.plans.details.premium.subtitle') }}
  </plan>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'BasicPlan',
})
</script>
