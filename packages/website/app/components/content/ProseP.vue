<script setup lang="ts">
defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <p class="text-rui-text-secondary text-body-1 mb-4">
    <slot />
  </p>
</template>
