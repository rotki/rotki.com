<template>
  <div
    :class="{
      [$style.card]: true,
      [$style.warning]: warning,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Card',
  props: {
    warning: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
})
</script>

<style lang="scss" module>
.card {
  @apply p-4 pt-1 rounded-md;

  box-shadow: 0 2px 12px rgba(74, 91, 120, 0.1) !important;
}

.warning {
  @apply border-red-500 border-2 border-solid;
}
</style>
