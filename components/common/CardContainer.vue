<script setup lang="ts">
withDefaults(defineProps<{ warning?: boolean }>(), {
  warning: false,
});

const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.card]: true,
      [css.warning]: warning,
    }"
  >
    <slot />
  </div>
</template>

<style lang="scss" module>
.card {
  @apply p-4 pt-1 rounded border border-gray-300 shadow-md;
}

.warning {
  @apply border-red-500 border-2 border-solid;
}
</style>
