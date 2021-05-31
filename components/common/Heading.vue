<template>
  <div :class="$style.heading">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Heading',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.heading {
  @apply font-serif text-primary2 font-medium;

  margin-top: 24px;

  @include text-size(24px, 32px);
}
</style>
