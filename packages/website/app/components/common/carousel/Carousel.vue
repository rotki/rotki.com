<script lang="ts" setup>
import type { AutoplayOptions, SwiperOptions } from 'swiper/types';
import { Autoplay, Keyboard } from 'swiper/modules';
import { Swiper } from 'swiper/vue';

const { autoplay, breakpoints } = defineProps<{
  autoplay?: AutoplayOptions | boolean;
  breakpoints?: {
    [width: number]: SwiperOptions;
    [ratio: string]: SwiperOptions;
  };
}>();

defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <Swiper
    :autoplay="autoplay"
    :breakpoints="breakpoints"
    class="w-full"
    direction="horizontal"
    effect="slide"
    :modules="[Autoplay, Keyboard]"
    :slides-per-view="1"
    :space-between="0"
    :keyboard="true"
  >
    <slot />
  </Swiper>
</template>
