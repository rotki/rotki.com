<script setup lang="ts">
import type { Swiper } from 'swiper/types';
import { set } from '@vueuse/core';
import { SwiperSlide } from 'swiper/vue';
import Carousel from '~/components/common/carousel/Carousel.vue';
import CarouselControls from '~/components/common/carousel/CarouselControls.vue';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const swiperInstance = ref<Swiper>();
const swiperReady = ref<boolean>(false);
const activeIndex = ref<number>(1);

const images = ref<string[]>([]);

function scanImages(): void {
  const assetContext = import.meta.glob(
    '~/public/img/screenshots/*.(png|jpe?g|webp)',
  );

  const assetPaths = Object.keys(assetContext).map(path =>
    path.replace('/public/img', '/img'),
  );

  set(images, assetPaths);
}

function onSwiperUpdate(s: Swiper): void {
  set(swiperInstance, s);
  set(swiperReady, true);
  set(activeIndex, s.activeIndex + 1);
}

/**
 * Determines if an image should be eagerly loaded (first image is LCP element)
 */
function getLoadingStrategy(index: number): 'eager' | 'lazy' {
  return index === 0 ? 'eager' : 'lazy';
}

/**
 * Returns fetch priority for images (first image gets high priority as it's the LCP element)
 */
function getFetchPriority(index: number): 'high' | 'auto' {
  return index === 0 ? 'high' : 'auto';
}

scanImages();
</script>

<template>
  <div
    :class="$style.container"
    class="container"
  >
    <Carousel
      :autoplay="{
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }"
      auto-height
      :class="$style.slider"
      @swiper="onSwiperUpdate($event)"
      @slide-change="onSwiperUpdate($event)"
    >
      <!-- Retain the height, so it's not jumping when the image first loaded -->
      <SwiperSlide
        v-for="(image, i) in images"
        :key="i"
        class="relative pt-[56.2%] bg-rui-grey-100"
      >
        <NuxtImg
          :src="image"
          alt=" "
          format="webp"
          :loading="getLoadingStrategy(i)"
          :fetchpriority="getFetchPriority(i)"
          sizes="sm:100vw md:80vw lg:900px"
          class="w-full absolute h-full top-0 left-0"
        />
      </SwiperSlide>
    </Carousel>
    <div class="container relative !px-0">
      <div :class="$style.controls">
        <CarouselControls
          v-model:swiper="swiperInstance"
          :active-index="activeIndex"
          :pages="images.length"
          :class="{ 'pointer-events-none': !swiperReady }"
          arrow-buttons
        />
        <div :class="$style.thumbnail">
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
