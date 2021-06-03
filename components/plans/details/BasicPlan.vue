<template>
  <plan action="Get Premium plan" url="/products/">
    <template #title>Premium</template>
    Premium users unlock the full potential of rotki by removing all limits and
    unlocking all features.
  </plan>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'BasicPlan',
})
</script>
