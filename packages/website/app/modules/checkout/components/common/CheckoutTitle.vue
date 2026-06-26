<script setup lang="ts">
const { as = 'h4' } = defineProps<{
  as?: 'h1' | 'h4';
}>();

defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <component
    :is="as"
    class="font-bold text-h4 text-rui-text mb-3"
  >
    <slot />
  </component>
</template>
