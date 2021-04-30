<template>
  <div :class="$style.wrapper">
    <div :class="$style.row">
      <div :class="$style.logo">
        <img alt="rotki" src="~/assets/img/logo-small.svg" />
      </div>
      <div :class="$style.links">
        <links />
        <footer-icon-links />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PageFooter',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container mx-auto;

  padding-bottom: 57px;
}

.row {
  @apply flex flex-row items-end;
}

.links {
  @apply flex flex-row justify-between flex-wrap;

  width: 100%;

  @include for-size(phone-only) {
    @apply justify-end;
  }
}

.logo {
  margin-left: 16px;
  margin-right: 60px;
}
</style>
