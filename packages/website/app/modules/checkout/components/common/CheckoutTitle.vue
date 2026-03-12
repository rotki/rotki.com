<script setup lang="ts">
defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <h4 class="font-bold text-h4 text-rui-text mb-3">
    <slot />
  </h4>
</template>
