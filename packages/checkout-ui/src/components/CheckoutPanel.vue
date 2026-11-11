<script setup lang="ts">
const { as = 'section', labelledBy } = defineProps<{
  /** The element to render, so the page keeps its landmarks. */
  as?: 'section' | 'aside' | 'div';
  /** The heading that names the panel, for a `section` or `aside` landmark. */
  labelledBy?: string;
}>();

defineSlots<{
  default: () => any;
}>();
</script>

<template>
  <component
    :is="as"
    :aria-labelledby="labelledBy"
    class="flex flex-col gap-4 p-4 md:p-6 bg-rui-surface border border-rui-divider rounded-rui-card"
  >
    <slot />
  </component>
</template>
