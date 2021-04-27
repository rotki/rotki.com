<template>
  <div :class="$style.caption">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Caption',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.caption {
  @apply flex flex-row mt-16 text-shade7 font-sans font-normal;

  @include text-size(18px, 32px);
}
</style>
