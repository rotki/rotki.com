<template>
  <button
    :class="{
      [$style.button]: true,
      [$style.primary]: primary,
      [$style.secondary]: !primary,
      [$style.filled]: filled,
    }"
    @click="$emit('click')"
  >
    {{ text }}
  </button>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'ActionButton',
  props: {
    text: {
      type: String,
      required: true,
    },
    primary: {
      type: Boolean,
      required: false,
      default: false,
    },
    filled: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media.scss';
@import '~assets/css/main.scss';

$font-size: 18px;
$line-height: 32px;

$button-height: 65px;
$button-width: 275px;

.button {
  @apply font-serif uppercase rounded-full border-2 focus:outline-none focus:ring-1 focus:ring-shade12 focus:ring-opacity-75;

  font-size: $font-size;
  line-height: $line-height;
  height: $button-height;
  width: $button-width;

  @include for-size(phone-only) {
    font-size: $font-size * $mobile-font-percentage;
    line-height: $font-size * $mobile-font-percentage;
    margin-left: $mobile-margin;
    margin-right: $mobile-margin;
    height: $button-height * $mobile-button-percentage;
    width: $button-width * $mobile-button-percentage;
  }
}

.primary {
  @apply text-white bg-primary hover:bg-shade12;
}

.secondary {
  @apply text-primary border-primary hover:bg-shade1;
}

.filled {
  @apply text-primary border-transparent hover:bg-shade1 bg-white;
}
</style>
