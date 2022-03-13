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
  @apply container;
}

.header {
  @apply flex flex-row justify-center;
}

.margin {
  @apply 2xl:mt-24 mt-12;
}

.padding {
  @apply 2xl:pt-12 pt-6;
}

.title {
  @apply header text-primary font-serif flex-col col-auto font-bold text-5xl;
}

.links {
  @apply flex flex-row justify-center mt-6 2xl:mt-12 mx-4 md:mx-auto;
}
</style>
