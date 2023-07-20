<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.caption">
    <slot />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.caption {
  @apply flex flex-row mt-16 text-rui-text-secondary font-normal;

  @include text-size(18px, 32px);
}
</style>
