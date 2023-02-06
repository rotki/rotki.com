<template>
  <div :class="css.content">
    <slot />
  </div>
</template>

<script setup lang="ts">
const css = useCssModule()
</script>

<style lang="scss" module>
.content {
  @apply flex-row flex flex-grow h-full w-full py-16;
}
</style>
