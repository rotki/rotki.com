<script setup lang="ts">
defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <ul class="leading-5 text-body-2 mb-6">
    <slot />
  </ul>
</template>
