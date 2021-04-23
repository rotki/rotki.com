<template>
  <div :class="$style.wrapper">
    <div :class="$style.protocol">
      <div :class="$style['title-wrapper']">
        <div v-if="image">
          <img :src="image" :class="$style.image" />
        </div>
        <div :class="$style.title">
          <slot name="name" />
        </div>
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
  name: 'DefiProtocol',
  props: {
    image: {
      required: false,
      default: '',
      type: String,
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-col;

  width: 33%;
  margin-top: 48px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.protocol {
  width: 320px;
}

.image {
  width: 50px;
}

.title-wrapper {
  @apply flex flex-row align-middle;
}

$title-font-size: 24px;
$title-line-height: 31px;

.title {
  @apply font-serif font-bold text-shade11 flex-col flex self-center;

  margin-left: 18px;
  font-size: $title-font-size;
  line-height: $title-line-height;
  letter-spacing: -0.03em;

  @include for-size(phone-only) {
    font-size: $title-font-size * $mobile-font-percentage;
    line-height: $title-line-height * $mobile-font-percentage;
  }
}

$description-font-size: 20px;
$description-line-height: 32px;

.description {
  @apply font-sans text-primary2;

  margin-top: 27px;
  font-size: $description-font-size * $mobile-font-percentage;
  line-height: $description-line-height * $mobile-font-percentage;
}
</style>
