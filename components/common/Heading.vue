<template>
  <div
    :class="{
      [$style.heading]: !subheading,
      [$style.subheading]: subheading,
      [$style.secondary]: secondary,
      [$style['no-margin']]: noMargin,
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
    noMargin: {
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
  @apply font-serif text-primary2 font-bold text-2xl;

  &:not(.no-margin) {
    @apply mt-6;
  }
}

.secondary {
  @apply font-serif text-primary2 font-bold text-xl;

  &:not(.no-margin) {
    @apply mt-6;
  }

  @include text-size(24px, 32px);
}

.subheading {
  @apply font-serif text-primary2 font-medium text-lg;

  &:not(.no-margin) {
    @apply mt-4;
  }
}
</style>
