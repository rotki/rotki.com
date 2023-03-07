<script setup lang="ts">
withDefaults(
  defineProps<{
    noMargin?: boolean;
    landing?: boolean;
  }>(),
  {
    noMargin: false,
    landing: false,
  }
);

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <div
      :class="{
        [css.header]: true,
        [css.margin]: !noMargin,
        [css.padding]: noMargin,
      }"
    >
      <div :class="css.title">rotki</div>
    </div>
    <slot name="subtitle" />
    <div :class="css.links">
      <LinksArea :landing="landing" />
      <slot />
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.wrapper {
  @apply container;
}

.header {
  @apply flex flex-row justify-center;
}

.margin {
  @apply 2xl:mt-24 mt-12;
}

.padding {
  @apply 2xl:pt-12 pt-6;
}

.title {
  @apply header text-primary font-serif flex-col col-auto font-bold text-5xl;
}

.links {
  @apply flex flex-row justify-center mt-6 2xl:mt-12 mx-4 md:mx-auto;
}
</style>
