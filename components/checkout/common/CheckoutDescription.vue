<template>
  <div :class="css.description">
    <slot />
  </div>
</template>

<script setup lang="ts">
const css = useCssModule()
</script>

<style lang="scss" module>
.description {
  @apply text-typography;

  line-height: 18px;
  font-size: 15px;
  margin-bottom: 56px;
  letter-spacing: 0;
}
</style>
