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
  @apply container mx-auto flex flex-col flex-grow;

  min-height: 100vh;
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  text-align: center;
  text-transform: uppercase;

  @include text-size(16px, 20px);
}

.content.center-vertically {
  @apply items-center;
}

.content.center-horizontally {
  @apply justify-center;
}

.content {
  @apply flex-row flex flex-grow;

  height: 100%;
}

.details.wideBody {
  max-width: 85%;

  @include for-size(phone-only) {
    max-width: 90%;
  }
}

.details {
  max-width: 800px;

  @include for-size(phone-only) {
    width: 90%;
  }
}

.hint {
  align-items: center;
  text-align: justify;
  color: #808080;
  bottom: 40px;
  width: 100%;

  div {
    margin-left: auto;
    margin-right: auto;
    max-width: 500px;
  }

  @include text-size(14px, 21px);
  @include for-size(phone-only) {
    bottom: $mobile-margin / 2;
    padding: $mobile-margin / 2;
  }
}
</style>
