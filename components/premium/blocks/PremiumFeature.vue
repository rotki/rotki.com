<template>
  <div :class="css.wrapper">
    <div :class="css.content">
      <div :class="css.title">
        <slot name="title"></slot>
      </div>
      <div :class="css.description">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const css = useCssModule()
</script>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

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
    width: 42%;
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
