<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">
      <div :class="$style.title">Rotki</div>
    </div>
    <div :class="$style.links">
      <links />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Header',
})
</script>

<style module lang="scss">
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
}

.title {
  @apply header text-primary font-serif flex-col col-auto;

  @include text-size(52px, 67px);
}

.links {
  @apply flex flex-row justify-center;

  margin-top: 50px;
}
</style>
