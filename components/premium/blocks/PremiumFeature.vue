<template>
  <div :class="$style.wrapper">
    <div :class="$style.content">
      <div :class="$style.title">
        <slot name="title"></slot>
      </div>
      <div :class="$style.description">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PremiumFeature',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply flex flex-col;

  margin-top: 160px;

  @include for-size(phone-only) {
    width: 100%;
    padding-right: $mobile-margin;
    padding-left: $mobile-margin;
  }

  @include for-size(tablet-portrait-up) {
    width: 100%;
    padding-right: $mobile-margin * 2;
    padding-left: $mobile-margin * 2;
  }

  @include for-size(tablet-landscape-up) {
    width: 40%;
  }
}

.content {
  max-width: 500px;

  @include for-size(desktop-up) {
    max-width: 600px;
  }
}

.title {
  @apply font-bold font-serif text-white;

  margin-bottom: 38px;
  letter-spacing: -0.01em;

  @include text-size(32px, 47px);
}

.description {
  @apply font-sans font-light text-white;

  @include text-size(24px, 30px);
}
</style>
