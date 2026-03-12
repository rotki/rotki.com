<script lang="ts" setup>
import type { AutoplayOptions, SwiperOptions } from 'swiper/types';
import { Autoplay, Keyboard } from 'swiper/modules';
import { Swiper } from 'swiper/vue';
import 'swiper/css';

const { autoplay, autoHeight = false, breakpoints } = defineProps<{
  autoplay?: AutoplayOptions | boolean;
  autoHeight?: boolean;
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
    :auto-height="autoHeight"
    :autoplay="autoplay"
    :breakpoints="breakpoints"
    class="w-full"
    direction="horizontal"
    effect="slide"
    :modules="[Autoplay, Keyboard]"
    :slides-per-view="1"
    :space-between="30"
    :keyboard="true"
  >
    <slot />
  </Swiper>
</template>
