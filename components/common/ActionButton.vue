<template>
  <button
    :class="{
      [$style.loading]: loading,
      [$style.button]: !small,
      [$style.primary]: primary,
      [$style.secondary]: !primary,
      [$style.filled]: filled,
      [$style.small]: small,
      [$style.warning]: warning,
      'cursor-not-allowed': loading,
    }"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span :class="$style.row">
      <slot />
      {{ text }}
    </span>
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
    loading: {
      required: false,
      default: false,
      type: Boolean,
    },
    warning: {
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
  @apply font-sans rounded focus:outline-none px-4 bg-primary3 font-bold;

  $button-height: 48px;

  height: $button-height !important;

  @include text-size(16px, 19px);

  @include for-size(phone-only) {
    height: $button-height * $mobile-button-percentage;
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

.button:disabled,
.small:disabled {
  @apply bg-shade5 hover:bg-shade5;
}

.loading:disabled,
.primary {
  @apply text-white bg-primary hover:bg-shade12;
}

.warning {
  @apply text-white bg-red-600 hover:bg-red-500;
}

.secondary {
  @apply text-primary border-primary hover:bg-shade1;
}

.filled {
  @apply text-primary border-transparent hover:bg-shade1 bg-white;
}

.row {
  @apply inline-flex items-center align-middle;
}
</style>
