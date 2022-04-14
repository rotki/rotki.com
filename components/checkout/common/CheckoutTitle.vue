<template>
  <div :class="$style.title">
    <slot />
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CheckoutTitle',
})
</script>
<style lang="scss" module>
.title {
  @apply font-serif font-bold text-3xl text-typography;
}
</style>
