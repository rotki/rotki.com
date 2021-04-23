<template>
  <div>
    <div :class="$style.wrapper">
      <div :class="$style.title">
        <slot name="title" />
      </div>
    </div>
    <div :class="$style.bottom">
      <div :class="$style.subtitle">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Info',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-row justify-center;
}

$title-font-size: 32px;
$title-line-height: 47px;

.title {
  @apply flex-col font-serif text-primary2 text-4xl;

  font-size: $title-font-size;
  line-height: $title-line-height;
  letter-spacing: -0.01em;

  @include for-size(phone-only) {
    font-size: $title-font-size * $mobile-font-percentage;
    line-height: $title-line-height * $mobile-font-percentage;
  }
}

$subtitle-font-size: 24px;
$subtitle-line-height: 30px;

.subtitle {
  @apply flex-col font-sans text-primary2 text-center;

  font-size: $subtitle-font-size;
  line-height: $subtitle-line-height;

  @include for-size(phone-only) {
    font-size: $subtitle-font-size * $mobile-font-percentage;
    line-height: $subtitle-line-height * $mobile-font-percentage;
  }
}

.bottom {
  @apply flex flex-row justify-center;

  margin-top: 25px;
  max-width: 290px;
}
</style>
