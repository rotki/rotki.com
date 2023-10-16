<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.description">
    <slot />
  </div>
</template>

<style lang="scss" module>
.description {
  @apply text-body-1 text-center text-rui-text-secondary;
}
</style>
