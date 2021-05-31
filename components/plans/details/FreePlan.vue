<template>
  <plan action="Start now for free" @click="$emit('download')">
    <template #title>Free</template>
    Users can download the application and start using it for free.
    <div :class="$style.filler"></div>
  </plan>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'FreePlan',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.filler {
  height: 100%;
}
</style>
