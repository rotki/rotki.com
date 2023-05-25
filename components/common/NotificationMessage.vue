<script setup lang="ts">
const emit = defineEmits<{ (e: 'dismiss'): void }>();

const dismiss = () => {
  emit('dismiss');
};
const css = useCssModule();
</script>

<template>
  <div :class="css.container">
    <div :class="css.box" @click="dismiss()">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" module>
.container {
  @apply fixed top-2 right-2 w-11/12 md:w-1/4;
}
.box {
  @apply bg-white rounded-lg border-gray-300 border p-3 shadow-md flex flex-row;
}
</style>
