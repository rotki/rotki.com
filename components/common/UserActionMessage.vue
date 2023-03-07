<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.body">
    <p :class="css.header">
      <slot name="header" />
    </p>
    <slot />
  </div>
</template>

<style module lang="scss">
.body {
  @apply font-sans text-shade11 text-xl;
}

.header {
  @apply font-serif font-bold text-shade11 pb-2 text-2xl mb-4;
}
</style>
