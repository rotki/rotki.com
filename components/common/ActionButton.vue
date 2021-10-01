<template>
  <button
    :class="{
      [$style.button]: !small,
      [$style.primary]: primary,
      [$style.secondary]: !primary,
      [$style.filled]: filled,
      [$style.small]: small,
    }"
    :disabled="disabled"
    @click="$emit('click')"
  >
    {{ text }}
  </button>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
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
    href: {
      type: String,
      required: false,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    small: {
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

.small {
  @apply font-serif uppercase rounded focus:outline-none;

  $button-height: 48px;
  $button-width: 220px;

  height: $button-height !important;
  width: $button-width !important;
  @include text-size(18px, 26px);

  @include for-size(phone-only) {
    height: $button-height * $mobile-button-percentage;
    width: $button-width * $mobile-button-percentage;
  }
}

.button {
  @apply font-serif uppercase rounded-full border-2 focus:outline-none focus:ring-1 focus:ring-shade12 focus:ring-opacity-75;

  $button-height: 65px;
  $button-width: 275px;

  height: $button-height;
  width: $button-width;
  @include text-size(18px, 32px);

  @include for-size(phone-only) {
    height: $button-height * $mobile-button-percentage;
    width: $button-width * $mobile-button-percentage;
  }
}

.button:disabled {
  @apply bg-gray-400 hover:bg-gray-400;
}

.primary {
  @apply text-white bg-primary hover:bg-shade12 font-bold;
}

.secondary {
  @apply text-primary border-primary hover:bg-shade1 font-bold;
}

.filled {
  @apply text-primary border-transparent hover:bg-shade1 bg-white;
}
</style>
