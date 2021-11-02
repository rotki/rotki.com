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
  @apply border p-7 rounded-sm bg-white;

  box-shadow: 0 4px 8px #0003;
  width: 392px;

  @include for-size(phone-only) {
    @apply p-6;

    width: 100%;
  }
}

.label {
  @apply text-typography font-sans mb-4 font-bold;

  @include text-size(32px, 38px);
}
</style>
