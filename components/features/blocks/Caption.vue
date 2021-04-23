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

$font-size: 18px;
$line-height: 32px;

.caption {
  @apply flex flex-row mt-16 text-shade7 font-sans font-normal;

  font-size: $font-size;
  line-height: $line-height;

  @include for-size(phone-only) {
    font-size: $font-size * $mobile-font-percentage;
    line-height: $line-height * $mobile-font-percentage;
  }
}
</style>
