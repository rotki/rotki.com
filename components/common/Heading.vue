<template>
  <div
    :class="{
      [$style.heading]: !subheading,
      [$style.subheading]: subheading,
    }"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Heading',
  props: {
    subheading: {
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
  @apply font-serif text-primary2 font-medium font-bold;

  margin-top: 24px;

  @include text-size(24px, 32px);
}

.subheading {
  @apply font-serif text-primary2 font-medium;

  margin-top: 18px;

  @include text-size(18px, 26px);
}
</style>
