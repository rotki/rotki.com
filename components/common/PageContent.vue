<template>
  <div :class="$style.content">
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PageContent',
})
</script>

<style lang="scss" module>
.content {
  @apply flex-row flex flex-grow h-full w-full py-16;
}
</style>
