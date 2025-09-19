<script lang="ts" setup>
import type { SwiperOptions } from 'swiper/types';
import { Autoplay, Keyboard } from 'swiper/modules';
import { Swiper } from 'swiper/vue';
import 'swiper/css';

withDefaults(defineProps<SwiperOptions>(), {
  effect: 'slide',
  direction: 'horizontal',
  autoHeight: false,
  enabled: true,
  slidesPerView: 1,
  spaceBetween: 30,
  centeredSlides: false,
  modules: () => [],
});
</script>

<template>
  <Swiper
    :auto-height="autoHeight"
    :autoplay="autoplay"
    :breakpoints="breakpoints"
    :centered-slides="centeredSlides"
    :class="$style.swiper"
    :coverflow-effect="coverflowEffect"
    :direction="direction"
    :effect="effect"
    :enabled="enabled"
    :loop="loop"
    :modules="[Autoplay, Keyboard, ...modules]"
    :navigation="navigation"
    :pagination="pagination"
    :slides-per-view="slidesPerView"
    :space-between="spaceBetween"
    :zoom="zoom"
    :keyboard="true"
  >
    <slot />
  </Swiper>
</template>

<style lang="scss" module>
.swiper {
  width: 100%;
}
</style>
