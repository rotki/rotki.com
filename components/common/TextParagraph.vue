<script setup lang="ts">
withDefaults(
  defineProps<{
    small?: boolean;
  }>(),
  {
    small: false,
  },
);

const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.text]: true,
      [css.small]: small,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.text {
  @apply text-rui-grey-800 text-justify;

  margin-top: 16px;

  @include text-size(18px, 26px);
}

.small {
  @include text-size(14px, 20px);
}
</style>
