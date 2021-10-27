<template>
  <div
    :class="{
      [$style.heading]: !subheading,
      [$style.subheading]: subheading,
      [$style.secondary]: secondary,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Heading',
  props: {
    subheading: {
      required: false,
      default: false,
      type: Boolean,
    },
    secondary: {
      required: false,
      default: false,
      type: Boolean,
    },
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.heading {
  @apply font-serif text-primary2 font-bold mt-6 text-2xl;
}

.secondary {
  @apply font-serif text-primary2 font-bold mt-6 text-xl;
}

.subheading {
  @apply font-serif text-primary2 font-medium mt-4 text-lg;
}
</style>
