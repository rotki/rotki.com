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

<script setup lang="ts">
withDefaults(defineProps<{ warning?: boolean }>(), {
  warning: false,
})

const css = useCssModule()
</script>

<style lang="scss" module>
.card {
  @apply p-4 pt-1 rounded-md;

  box-shadow: 0 2px 12px rgba(74, 91, 120, 0.1) !important;
}

.warning {
  @apply border-red-500 border-2 border-solid;
}
</style>
