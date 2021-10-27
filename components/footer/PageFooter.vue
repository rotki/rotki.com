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
      <div :class="$style.copyright">
        <div>© Rotki Solutions GmbH 2018-{{ year }}.</div>
        <div>All Rights Reserved.</div>
      </div>
      <footer-legalese />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
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

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container mx-auto;

  padding-bottom: 57px;
}

.row {
  @apply flex flex-row items-end;

  padding-right: $mobile-margin * 2;
  padding-left: $mobile-margin * 2;

  @include for-size(phone-only) {
    padding-right: $mobile-margin;
    padding-left: $mobile-margin;
  }
}

.secondRow {
  @apply flex flex-row justify-between flex-wrap;

  margin-top: 48px;
  padding-right: $mobile-margin * 2;
  padding-left: $mobile-margin * 2;

  > * {
    height: 36px;
  }

  @include for-size(phone-only) {
    @apply justify-center;

    padding-right: $mobile-margin;
    padding-left: $mobile-margin;
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
  @apply font-sans text-shade11 flex-row flex;

  > * {
    padding-left: 4px;
    padding-right: 4px;
  }

  @include text-size(14px, 20px);
  @include for-size(phone-only) {
    @apply flex-col text-center;

    > * {
      padding-top: 2px;
    }
  }
}

.logo {
  margin-left: 16px;
  margin-right: 60px;
}
</style>
