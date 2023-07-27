<script lang="ts" setup>
import 'swiper/css';
import { Swiper } from 'swiper/vue';
import type { SwiperOptions } from 'swiper/types';

withDefaults(defineProps<SwiperOptions>(), {
  effect: 'slide',
  direction: 'horizontal',
  autoHeight: false,
  enabled: true,
  slidesPerView: 1,
  spaceBetween: 30,
  centeredSlides: false,
});

const css = useCssModule();
</script>

<template>
  <Swiper
    :auto-height="autoHeight"
    :autoplay="autoplay"
    :breakpoints="breakpoints"
    :centered-slides="centeredSlides"
    :class="css.swiper"
    :coverflow-effect="coverflowEffect"
    :direction="direction"
    :effect="effect"
    :enabled="enabled"
    :loop="loop"
    :modules="modules"
    :navigation="navigation"
    :pagination="pagination"
    :slides-per-view="slidesPerView"
    :space-between="spaceBetween"
    :zoom="zoom"
  >
    <slot />
  </Swiper>
</template>

<style lang="scss" module>
.swiper {
  width: 100%;
}
</style>
