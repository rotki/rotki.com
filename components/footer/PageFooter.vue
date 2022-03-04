<template>
  <div :class="$style.wrapper">
    <div :class="$style.row">
      <div :class="$style.logo">
        <img alt="rotki" src="~/assets/img/logo-small.svg" />
      </div>
      <div :class="$style.links">
        <links landing />
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
  props: {
    landing: {
      required: false,
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const year = new Date().getFullYear().toString()
    return { year }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container mx-auto pb-0 2xl:pb-4;
}

.row {
  @apply flex flex-row items-end md:px-8 px-4;
}

.secondRow {
  @apply flex flex-row justify-center md:justify-between flex-wrap mt-6 2xl:mt-12 md:px-8 px-4;

  > * {
    @apply h-9;
  }
}

.links {
  @apply flex flex-row md:justify-between flex-wrap w-full justify-end;

  &:first-child {
    @apply hidden 2xl:visible;
  }

  > * {
    @apply my-2;
  }
}

.copyright {
  @apply font-sans text-shade11 md:flex-row flex text-sm flex-col w-full md:w-max text-center md:text-left my-4 md:my-0;

  > * {
    @apply md:px-1 pt-0.5;
  }
}

.logo {
  @apply ml-4 mr-14;
}
</style>
