<template>
  <plan :action="$tc('actions.get_advanced_plan')">
    <template #title>{{ $t('home.plans.details.advanced.title') }}</template>
    {{ $t('home.plans.details.advanced.subtitle') }}
  </plan>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'AdvancedPlan',
})
</script>
