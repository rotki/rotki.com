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

  width: 40%;
  margin-top: 160px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.content {
  max-width: 500px;
}

$title-font-size: 32px;
$title-line-height: 47px;

.title {
  @apply font-bold font-serif text-white;

  margin-bottom: 38px;
  font-size: $title-font-size;
  line-height: $title-line-height;
  letter-spacing: -0.01em;

  @include for-size(phone-only) {
    font-size: $title-font-size * $mobile-font-percentage;
    line-height: $title-line-height * $mobile-font-percentage;
  }
}

$description-font-size: 24px;
$description-line-height: 30px;

.description {
  @apply font-sans font-light text-white;

  font-size: $description-font-size;
  line-height: $description-line-height;

  @include for-size(phone-only) {
    font-size: $description-font-size * $mobile-font-percentage;
    line-height: $description-line-height * $mobile-font-percentage;
  }
}
</style>
