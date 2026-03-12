<script setup lang="ts">
defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <div class="text-h5 my-6">
    <slot />
  </div>
</template>
