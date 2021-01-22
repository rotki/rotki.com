<template>
  <plan action="Get basic plan">
    <template #title>Basic</template>
    Premium users can set watchers for various protocol so that they can be
    informed via email when certain conditions are met.
  </plan>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'BasicPlan',
})
</script>
