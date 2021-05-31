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
    <div :class="$style.secondRow">
      <span :class="$style.copyright">
        © Rotki Solutions GmbH 2018-{{ year }}. All Rights Reserved.
      </span>
      <footer-legalese />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PageFooter',
  data() {
    return {
      year: '2021',
    }
  },
  created() {
    this.year = new Date().getFullYear().toString()
  },
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

.secondRow {
  @apply flex flex-row justify-between flex-wrap;

  margin-top: 48px;

  > * {
    height: 36px;
  }

  @include for-size(phone-only) {
    @apply justify-center;
  }
}

.links {
  @apply flex flex-row justify-between flex-wrap;

  width: 100%;

  > * {
    margin-top: 8px;
    margin-bottom: 8px;
  }

  @include for-size(phone-only) {
    @apply justify-end;
  }
}

.copyright {
  @apply font-sans text-shade11;

  @include text-size(14px, 20px);
}

.logo {
  margin-left: 16px;
  margin-right: 60px;
}
</style>
