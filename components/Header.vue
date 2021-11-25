<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">
      <div :class="$style.title">Rotki</div>
    </div>
    <slot name="subtitle" />
    <div :class="$style.links">
      <links />
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Header',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container mx-auto;
}

.header {
  @apply flex flex-row justify-center;

  margin-top: 94px;
  @include for-size(phone-only) {
    margin-top: 42px;
  }

  @media only screen and (max-height: 750px) {
    margin-top: 24px;
  }
}

.title {
  @apply header text-primary font-serif flex-col col-auto font-bold;

  @include text-size(52px, 67px);
}

.links {
  @apply flex flex-row justify-center;

  margin-top: 50px;

  @include for-size(phone-only) {
    @include margin-x($mobile-margin * 2);
  }
}
</style>
