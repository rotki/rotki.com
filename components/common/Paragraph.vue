<template>
  <p
    :class="{
      [$style.text]: true,
      [$style.small]: small,
    }"
  >
    <slot />
  </p>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
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

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.text {
  @apply font-sans text-shade11 text-justify;

  margin-top: 16px;
}

.small {
  @include text-size(14px, 20px);
}
</style>
