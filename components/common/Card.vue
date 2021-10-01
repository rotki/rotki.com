<template>
  <div :class="$style.card">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

export default defineComponent({
  name: 'Card',
})
</script>

<style lang="scss" module>
.card {
  @apply p-4 pt-1 rounded-md;

  box-shadow: 0 2px 12px rgba(74, 91, 120, 0.1) !important;
}
</style>
