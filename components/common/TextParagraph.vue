<script setup lang="ts">
withDefaults(
  defineProps<{
    small?: boolean;
  }>(),
  {
    small: false,
  },
);
</script>

<template>
  <div
    :class="{
      [$style.text]: true,
      [$style.small]: small,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss" module>
@use '@/assets/css/media' as media;
@use '@/assets/css/main';

.text {
  @apply text-rui-grey-800 text-justify;

  margin-top: 16px;

  @include media.text-size(18px, 26px);
}

.small {
  @include media.text-size(14px, 20px);
}
</style>
