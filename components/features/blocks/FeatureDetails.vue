<template>
  <div :class="$style.wrapper">
    <div :class="$style.column">
      <div v-if="$slots.subtitle" :class="$style.subtitle">
        <slot name="subtitle" />
      </div>
      <div :class="$style.description">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'FeatureDetails',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-row;

  margin-bottom: 40px;
}

.column {
  @apply flex flex-col;
}

$subtitle-font-size: 25px;
$subtitle-line-height: 46px;

.subtitle {
  @apply flex flex-row font-serif font-bold text-primary2;

  font-size: $subtitle-font-size;
  line-height: $subtitle-line-height;
  letter-spacing: -0.01em;
  margin-top: 58px;
  margin-bottom: 16px;

  @include for-size(phone-only) {
    font-size: $subtitle-font-size * $mobile-font-percentage;
    line-height: $subtitle-line-height * $mobile-font-percentage;
  }
}

$description-font-size: 24px;
$description-line-height: 32px;

.description {
  @apply flex flex-row font-sans text-primary2;

  font-size: $description-font-size * $mobile-font-percentage;
  line-height: $description-line-height * $mobile-font-percentage;
}
</style>
