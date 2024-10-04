<script setup lang="ts">
withDefaults(
  defineProps<{
    subheading?: boolean;
    noMargin?: boolean;
    secondary?: boolean;
  }>(),
  {
    subheading: false,
    noMargin: false,
    secondary: false,
  },
);

const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.heading]: !subheading,
      [css.subheading]: subheading,
      [css.secondary]: secondary,
      [css['no-margin']]: noMargin,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media';
@import '@/assets/css/main';

.heading {
  @apply text-rui-text font-bold text-2xl;

  &:not(.no-margin) {
    @apply mt-6;
  }
}

.secondary {
  @apply text-rui-text font-bold text-xl;

  &:not(.no-margin) {
    @apply mt-6;
  }

  @include text-size(24px, 32px);
}

.subheading {
  @apply text-rui-text font-medium text-lg;

  &:not(.no-margin) {
    @apply mt-4;
  }
}
</style>
