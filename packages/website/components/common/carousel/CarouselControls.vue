<script lang="ts" setup>
import type { Swiper } from 'swiper/types';
import { get, set } from '@vueuse/core';
import 'swiper/css';

const swiper = defineModel<Swiper>('swiper');

withDefaults(
  defineProps<{
    activeIndex: number;
    pages: number;
    arrowButtons?: boolean;
  }>(),
  {
    arrowButtons: false,
  },
);

function onNavigate(index: number): void {
  const s = get(swiper);

  if (!s)
    return;

  s.slideTo(index - 1);
  set(swiper, s);
}
</script>

<template>
  <RuiFooterStepper
    :class="$style.controls"
    :model-value="activeIndex"
    :pages="pages"
    :arrow-buttons="arrowButtons"
    variant="bullet"
    @update:model-value="onNavigate($event)"
  />
</template>

<style lang="scss" module>
.controls {
  width: 100%;
}
</style>
