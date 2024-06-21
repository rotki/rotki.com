<script setup lang="ts">
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { SwiperSlide } from 'swiper/vue';
import { get, set } from '@vueuse/core';
import type { Swiper } from 'swiper/types';

const css = useCssModule();

const swiper = ref<Swiper>();
const pages = ref(get(swiper)?.snapGrid.length ?? 1);
const activeIndex = ref((get(swiper)?.activeIndex ?? 0) + 1);

const images = ref([]);

function scanImages() {
  const assetContext = import.meta.glob(
    '~/public/img/screenshots/*.(png|jpe?g|webp)',
  );

  const assetPaths = Object.keys(assetContext).map(path =>
    path.replace('/public/img', '/img'),
  );

  set(images, assetPaths);
}

function onSwiperUpdate(s: Swiper) {
  set(swiper, s);
  set(activeIndex, s.activeIndex + 1);
  set(pages, s.snapGrid.length);
}

scanImages();
</script>

<template>
  <div
    :class="css.container"
    class="container"
  >
    <Carousel
      :autoplay="{
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }"
      auto-height
      :class="css.slider"
      @swiper="onSwiperUpdate($event)"
      @slide-change="onSwiperUpdate($event)"
    >
      <!-- Retain the height, so it's not jumping when the image first loaded -->
      <SwiperSlide
        v-for="(image, i) in images"
        :key="i"
        class="relative pt-[56.2%]"
      >
        <img
          :src="image"
          alt=" "
          class="w-full absolute h-full top-0 left-0"
        />
      </SwiperSlide>
    </Carousel>
    <div class="container relative !px-0">
      <div :class="css.controls">
        <CarouselControls
          v-if="swiper"
          v-model:swiper="swiper"
          :active-index="activeIndex"
          :pages="pages"
          arrow-buttons
        />
        <div :class="css.thumbnail">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.container {
  @apply flex flex-col relative;

  .slider {
    @apply rounded-lg md:rounded-2xl lg:rounded-3xl border border-black/[0.12];
  }

  .controls {
    @apply flex flex-col md:absolute top-0 mt-4 transform md:translate-y-[calc(-50%-2.5rem)] md:-left-6 md:-right-6 items-center justify-center z-[1];

    .thumbnail {
      @apply px-8 py-2 md:py-6 rounded-xl border border-black/[.12] bg-white;
      box-shadow: 4px 32px 80px 0 rgba(191, 194, 203, 0.24);
    }
  }
}
</style>
