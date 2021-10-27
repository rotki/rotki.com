<template>
  <plan action="Start now for free" @click="$emit('download')">
    <template #title>Free</template>
    Anyone can download the application and start using it for free.
    <div :class="$style.filler"></div>
  </plan>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'FreePlan',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.filler {
  height: 100%;
}
</style>
