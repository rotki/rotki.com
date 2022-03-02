<template>
  <div :class="$style.wrapper">
    <div
      :class="{
        [$style.header]: true,
        [$style.margin]: !noMargin,
        [$style.padding]: noMargin,
      }"
    >
      <div :class="$style.title">Rotki</div>
    </div>
    <slot name="subtitle" />
    <div :class="$style.links">
      <links :landing="landing" />
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Header',
  props: {
    noMargin: {
      required: false,
      default: false,
      type: Boolean,
    },
    landing: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container mx-auto;
}

.header {
  @apply flex flex-row justify-center;
}

.margin {
  margin-top: 94px;
  @include for-size(phone-only) {
    margin-top: 42px;
  }

  @media only screen and (max-height: 750px) {
    margin-top: 24px;
  }
}

.padding {
  padding-top: 48px;
  @include for-size(phone-only) {
    padding-top: 42px;
  }

  @media only screen and (max-height: 750px) {
    padding-top: 24px;
  }
}

.title {
  @apply header text-primary font-serif flex-col col-auto font-bold;

  @include text-size(52px, 67px);
}

.links {
  @apply flex flex-row justify-center;

  margin-top: 50px;

  @include for-size(phone-only) {
    @include margin-x($mobile-margin * 2);
  }
}
</style>
