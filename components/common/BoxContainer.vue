<script setup lang="ts">
const stop = (event: any) => {
  event.stopPropagation();
};
const slots = useSlots();
const css = useCssModule();
</script>

<template>
  <div :class="css.box" @click="stop($event)">
    <div v-if="slots.label" :class="css.label">
      <slot name="label" />
    </div>

    <slot />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.box {
  @apply border p-4 md:p-7 rounded-sm bg-white w-full md:w-96;

  box-shadow: 0 4px 8px #0003;
}

.label {
  @apply text-typography font-serif mb-6 font-bold text-2xl;
}
</style>
