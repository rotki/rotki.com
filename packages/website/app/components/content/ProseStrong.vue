<script setup lang="ts">
defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <strong class="text-rui-text">
    <slot />
  </strong>
</template>
