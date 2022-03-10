<template>
  <div :class="$style.wrapper" v-bind="$attrs">
    <div :class="$style.content">
      <div :class="$slots.image ? $style.column1 : $style.column">
        <div :class="$style.title">
          <div :class="$style.column">
            <anchor :id="id" />
            <slot name="title" />
          </div>
        </div>
        <slot></slot>
      </div>
      <div v-if="$slots.image" :class="$style.column2">
        <slot name="image" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Feature',
  props: {
    id: {
      type: String,
      required: true,
    },
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @include for-size(phone-only) {
    @include margin-x($mobile-margin);
  }

  @include for-size(tablet-portrait-up) {
    @include margin-x($mobile-margin);
  }
}

.content {
  @apply flex flex-row flex-wrap-reverse;

  width: 100%;
  overflow-x: hidden;
  padding-top: 191px;

  @include for-size(phone-only) {
    @apply justify-center;
  }

  @include for-size(tablet-portrait-up) {
    height: 100%;
    overflow-x: visible;
    padding-right: $mobile-margin * 2;
    padding-left: $mobile-margin * 2;
  }

  @include for-size(tablet-landscape-up) {
    height: 100%;
    overflow-x: hidden;
  }

  @include for-size(desktop-up) {
    height: 100%;
    overflow-x: visible;
  }
}

.title {
  @apply flex flex-row font-serif font-bold text-shade11;

  letter-spacing: -0.03em;
  margin-bottom: 27px;

  @include text-size(52px, 67px);
}

.column {
  @apply flex flex-col;
}

.column1 {
  @apply flex flex-col;

  @include for-size(phone-only) {
    width: 100%;
  }

  @include for-size(desktop-up) {
    max-width: 720px;
  }
}

.column2 {
  @apply flex flex-col;

  @include for-size(tablet-portrait-up) {
    width: 100%;
    @apply relative block;
  }
}
</style>
