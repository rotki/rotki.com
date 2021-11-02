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
  @apply text-typography;

  line-height: 33px;
  font-size: 28px;
  letter-spacing: 0;
  margin-bottom: 16px;
}
</style>
