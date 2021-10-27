<template>
  <div
    :class="{
      [$style.text]: true,
      [$style.small]: small,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Paragraph',
  props: {
    small: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.text {
  @apply font-sans text-shade11 text-justify;

  margin-top: 16px;

  @include text-size(18px, 26px);
}

.small {
  @include text-size(14px, 20px);
}
</style>
