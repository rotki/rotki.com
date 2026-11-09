<script setup lang="ts">
const { as = 'section' } = defineProps<{
  /** The element to render, so the page keeps its landmarks. */
  as?: 'section' | 'aside' | 'div';
}>();

defineSlots<{
  default: () => any;
}>();
</script>

<template>
  <component
    :is="as"
    class="flex flex-col gap-4 p-4 md:p-6 bg-rui-surface border border-rui-divider rounded-rui-card"
  >
    <slot />
  </component>
</template>
