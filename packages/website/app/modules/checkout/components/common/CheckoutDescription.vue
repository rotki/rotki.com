<script setup lang="ts">
defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <div class="text-body-1 text-rui-text-secondary">
    <slot />
  </div>
</template>
