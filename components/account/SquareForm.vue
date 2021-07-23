<template>
  <fragment>
    <div :class="$style.wrapper">
      <div :class="$style.row">
        <div :class="$style.column">
          <div :class="$style.header">
            <div :class="$style.title">Rotki</div>
            <div :class="$style.subtitle">
              <slot name="subtitle" />
            </div>
          </div>

          <div :class="$style.inputs">
            <slot />
          </div>
        </div>
      </div>
    </div>
    <div v-if="$slots.hint" :class="$style.hint">
      <div>
        <slot name="hint" />
      </div>
    </div>
  </fragment>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'SquareForm',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply w-screen h-screen flex flex-row items-center justify-center;

  @include for-size(phone-only) {
    padding: $mobile-margin / 2;
  }
}

.header {
  padding-bottom: 20px;
  @include for-size(phone-only) {
    padding-bottom: $mobile-margin / 2;
    padding-top: $mobile-margin;
  }
}

.title {
  @apply font-serif font-bold text-primary;

  @include text-size(52px, 67px);
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-transform: uppercase;
}

.row {
  @apply flex flex-row mx-auto;

  @include for-size(tablet-portrait-up) {
    max-width: 340px;
    max-height: 340px;
  }
}

.column {
  @apply flex flex-col;
}

.hint {
  position: absolute;
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

.inputs {
  margin-top: 24px;
}
</style>
