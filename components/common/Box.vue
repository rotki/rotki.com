<template>
  <div :class="$style.box" @click="stop($event)">
    <div v-if="$slots.label" :class="$style.label">
      <slot name="label" />
    </div>

    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Box',
  setup() {
    const stop = (event: any) => {
      event.stopPropagation()
    }

    return { stop }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.box {
  @apply border p-4 md:p-7 rounded-sm bg-white w-full md:w-96;

  box-shadow: 0 4px 8px #0003;
}

.label {
  @apply text-typography font-serif mb-6 font-bold text-2xl;
}
</style>
