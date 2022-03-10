<template>
  <div :class="$style.wrapper">
    <Header no-margin>
      <template #subtitle>
        <div :class="$style.subtitle">
          <slot name="title" />
        </div>
      </template>
      <slot name="links" />
    </Header>

    <div
      :class="{
        [$style.content]: true,
        [$style['center-vertically']]: centerVertically,
        [$style['center-horizontally']]: centerHorizontally,
      }"
    >
      <div
        :class="{
          [$style.details]: true,
          [$style.wideBody]: wide,
        }"
      >
        <slot />
      </div>
    </div>

    <div v-if="$slots.hint" :class="$style.hint">
      <slot name="hint"></slot>
    </div>

    <page-footer />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Page',
  props: {
    wide: {
      type: Boolean,
      required: false,
      default: false,
    },
    centerVertically: {
      type: Boolean,
      required: false,
      default: true,
    },
    centerHorizontally: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply container mx-auto flex flex-col flex-grow min-h-screen;
}

.subtitle {
  @apply font-sans text-primary2 font-medium text-center uppercase text-base;
}

.content.center-vertically {
  @apply items-center;
}

.content.center-horizontally {
  @apply justify-center;
}

.content {
  @apply flex-row flex flex-grow h-full;
}

.details.wideBody {
  max-width: 85%;

  @include for-size(phone-only) {
    max-width: 90%;
  }
}

.details {
  @apply w-full 2xl:max-w-5xl xl:max-w-3xl;

  @include for-size(phone-only) {
    width: 90%;
  }
}

.hint {
  @apply items-center text-justify w-full bottom-10 text-shade8 text-sm sm:p-2 sm:bottom-2;

  div {
    @apply ml-auto mr-auto max-w-lg;
  }
}
</style>
