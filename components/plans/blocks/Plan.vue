<template>
  <div :class="$style.plan">
    <div :class="$style.title">
      <slot name="title"></slot>
    </div>
    <div :class="$style.description">
      <slot></slot>
      <div :class="$style.button">
        <action-button :text="action"></action-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Plan',
  props: {
    action: {
      type: String,
      required: true,
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.plan {
  @apply flex flex-col col-span-12 md:col-span-4 flex-shrink;

  margin-top: 93px;
}

$title-font-size: 32px;
$title-line-height: 47px;

.title {
  @apply font-bold text-primary2 font-serif text-center;

  letter-spacing: -0.01em;
  font-size: $title-font-size;
  line-height: $title-line-height;

  @include for-size(phone-only) {
    font-size: $title-font-size * $mobile-font-percentage;
    line-height: $title-line-height * $mobile-font-percentage;
  }
}

$body-font-size: 24px;
$body-line-height: 32px;

.description {
  @apply font-sans text-center text-primary2 flex flex-col self-center;

  font-size: $body-font-size;
  line-height: $body-line-height;
  margin-top: 45px;
  max-width: 370px;

  @include for-size(phone-only) {
    font-size: $body-font-size * $mobile-font-percentage;
    line-height: $body-line-height * $mobile-font-percentage;
  }
}

.button {
  margin-top: 75px;
}
</style>
