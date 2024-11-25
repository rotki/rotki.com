<script setup lang="ts">
function stop(event: any) {
  event.stopPropagation();
}
const slots = useSlots();
</script>

<template>
  <div
    :class="$style.box"
    @click="stop($event)"
  >
    <div
      v-if="slots.label"
      :class="$style.label"
    >
      <slot name="label" />
    </div>

    <slot />
  </div>
</template>

<style lang="scss" module>
@use '@/assets/css/media';
@use '@/assets/css/main';

.box {
  @apply border p-4 md:p-7 rounded-sm bg-white w-full md:w-96;

  box-shadow: 0 4px 8px #0003;
}

.label {
  @apply text-rui-text mb-6 font-bold text-2xl;
}
</style>
