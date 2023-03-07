<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.title">
    <slot />
  </div>
</template>

<style lang="scss" module>
.title {
  @apply font-serif font-bold text-3xl text-typography;
}
</style>
