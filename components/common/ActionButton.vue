<template>
  <button
    :class="{
      [$style.button]: true,
      [$style.primary]: primary,
      [$style.secondary]: !primary,
      [$style.filled]: filled,
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
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

$button-height: 65px;
$button-width: 275px;

.button {
  @apply font-serif uppercase rounded-full border-2 focus:outline-none focus:ring-1 focus:ring-shade12 focus:ring-opacity-75;

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
  @apply text-white bg-primary hover:bg-shade12;
}

.secondary {
  @apply text-primary border-primary hover:bg-shade1;
}

.filled {
  @apply text-primary border-transparent hover:bg-shade1 bg-white;
}
</style>
