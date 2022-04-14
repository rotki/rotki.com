<template>
  <button
    :class="{
      [$style.button]: true,
      [$style.loading]: loading,
      [$style.large]: !small,
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
      required: false,
      default: null,
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

.button {
  @apply relative overflow-hidden transition transform hover:scale-110;

  &::after {
    content: '';
    width: 300px;
    height: 300px;
    @apply absolute z-10 left-1/2 top-1/2 bg-black bg-opacity-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 scale-0 rounded-full;
  }

  &:hover::after {
    @apply scale-100;
  }

  &:disabled {
    @apply hover:scale-100;

    &::after {
      content: unset;
    }
  }
}

.small {
  @apply font-sans rounded focus:outline-none px-4 bg-primary3 font-bold;

  $button-height: 48px;

  height: $button-height !important;

  @include text-size(16px, 19px);

  @include for-size(phone-only) {
    height: $button-height * $mobile-button-percentage;
  }
}

.large {
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

.large:disabled,
.small:disabled {
  @apply bg-shade5 hover:bg-shade5;
}

.loading:disabled,
.primary {
  @apply text-white bg-primary font-bold;
}

.warning {
  @apply text-white bg-red-600 hover:bg-red-500;
}

.secondary {
  @apply text-primary border-primary hover:bg-shade1 font-bold;
}

.filled {
  @apply text-primary border-transparent hover:bg-shade1 bg-white;
}

.row {
  @apply inline-flex items-center align-middle relative z-20;
}
</style>
