<template>
  <plan action="Get Premium plan" url="/products/">
    <template #title>Premium</template>
    Premium users unlock the full potential of rotki by removing all limits and
    unlocking all features.
  </plan>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'BasicPlan',
})
</script>
