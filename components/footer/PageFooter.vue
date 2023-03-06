<template>
  <div :class="css.wrapper">
    <div :class="css.row">
      <div :class="css.logo">
        <img alt="rotki" src="/img/logo-small.svg" />
      </div>
      <div :class="css.menus">
        <LinksArea landing />
      </div>
      <div :class="css.links">
        <FooterIconLinks />
      </div>
    </div>
    <div :class="css.secondRow">
      <div :class="css.copyright">
        <div>© Rotki Solutions GmbH 2018-{{ year }}.</div>
        <div>All Rights Reserved.</div>
      </div>
      <FooterLegalese />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    landing?: boolean
  }>(),
  {
    landing: false,
  }
)

const year = new Date().getFullYear().toString()
const css = useCssModule()
</script>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.wrapper {
  @apply container pb-0 pb-4;
}

.row {
  @apply flex flex-wrap flex-col lg:flex-row items-center justify-center xl:justify-start md:px-8 px-4 space-y-8;
}

.logo {
  @apply ml-4;
}

.menus {
  @apply flex flex-1 mx-0 lg:mx-14;
}

.links {
  > * {
    @apply my-2;
  }
}

.secondRow {
  @apply flex flex-row justify-center lg:justify-between flex-wrap mt-6 2xl:mt-12 md:px-8 px-4;

  > * {
    @apply py-2;
  }
}

.copyright {
  @apply font-sans text-shade11 md:flex-row flex text-sm flex-col w-full md:w-max text-center md:text-left my-4 md:my-0;

  > * {
    @apply md:px-1 pt-0.5;
  }
}
</style>
