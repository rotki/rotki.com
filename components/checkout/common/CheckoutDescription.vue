<template>
  <div :class="$style.description">
    <slot />
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CheckoutDescription',
})
</script>
<style lang="scss" module>
.description {
  @apply text-typography;

  line-height: 18px;
  font-size: 15px;
  margin-bottom: 56px;
  letter-spacing: 0;
}
</style>
