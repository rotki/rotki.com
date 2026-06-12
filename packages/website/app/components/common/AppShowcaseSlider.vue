<script setup lang="ts">
import type { Swiper } from 'swiper/types';
import { set } from '@vueuse/shared';
import { SwiperSlide } from 'swiper/vue';
import Carousel from '~/components/common/carousel/Carousel.vue';
import CarouselControls from '~/components/common/carousel/CarouselControls.vue';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

defineProps<{
  hideThumbnail?: boolean;
}>();

defineSlots<{
  default: () => void;
}>();

const swiperInstance = ref<Swiper>();
const swiperReady = ref<boolean>(false);
const activeIndex = ref<number>(1);

interface ScreenshotImage {
  src: string;
  alt: string;
}

const screenshotAltTexts: Record<string, string> = {
  '1-sc-dashboard': 'rotki dashboard showing portfolio overview',
  '2-sc-history-events': 'rotki history events and transaction tracking',
  '3-sc-statistics1': 'rotki statistics and portfolio analytics',
  '4-sc-statistics2': 'rotki detailed statistical charts',
  '5-sc-eth-staking': 'rotki Ethereum staking overview',
  '6-sc-gnosis-pay': 'rotki Gnosis Pay integration',
  '7-sc-onchain-send': 'rotki on-chain transaction sending',
};

function getAltText(path: string): string {
  const filename = path.split('/').pop()?.replace(/\.\w+$/, '') ?? '';
  return screenshotAltTexts[filename] ?? 'rotki application screenshot';
}

const images = ref<ScreenshotImage[]>([]);

function scanImages(): void {
  const assetContext = import.meta.glob(
    '~~/public/img/screenshots/*.(png|jpe?g|webp)',
  );
  const assetPaths = Object.keys(assetContext);
  set(images, assetPaths.map((src) => {
    const publicSrc = src.replace(/.*\/public\//, '/');
    return { src: publicSrc, alt: getAltText(src) };
  }));
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

/**
 * Responsive srcset for the first image only (the LCP element). Pre-generated
 * width variants live in a `responsive/` subfolder (kept out of the slide glob
 * above); the original webp is the 2880w source. Mobile pulls a ~14-40KB variant
 * instead of the 78KB source.
 */
function getSrcset(image: ScreenshotImage, index: number): string | undefined {
  if (index !== 0)
    return undefined;
  // /img/screenshots/1-sc-dashboard.webp -> /img/screenshots/responsive/1-sc-dashboard
  const base = image.src.replace(/\/([^/]+)\.webp$/, '/responsive/$1');
  return `${base}-640w.webp 640w, ${base}-960w.webp 960w, ${base}-1440w.webp 1440w, ${image.src} 2880w`;
}

const firstImageSizes = '(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px';

function getSizes(index: number): string | undefined {
  return index === 0 ? firstImageSizes : undefined;
}

scanImages();
</script>

<template>
  <div class="container flex flex-col relative">
    <Carousel
      :autoplay="{
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }"
      class="rounded-lg md:rounded-2xl lg:rounded-3xl border border-black/[0.12]"
      @swiper="onSwiperUpdate($event)"
      @slide-change="onSwiperUpdate($event)"
    >
      <!-- Retain the height, so it's not jumping when the image first loaded -->
      <SwiperSlide
        v-for="(image, i) in images"
        :key="i"
        class="relative pt-[56.2%] bg-rui-grey-100"
      >
        <img
          :src="image.src"
          :srcset="getSrcset(image, i)"
          :sizes="getSizes(i)"
          :alt="image.alt"
          width="1440"
          height="810"
          :loading="getLoadingStrategy(i)"
          :fetchpriority="getFetchPriority(i)"
          class="w-full absolute h-full top-0 left-0"
        />
      </SwiperSlide>
    </Carousel>
    <div class="container relative !px-0">
      <div class="flex flex-col md:absolute top-0 mt-4 transform md:translate-y-[calc(-50%-2.5rem)] md:-left-6 md:-right-6 items-center justify-center z-[1]">
        <CarouselControls
          v-model:swiper="swiperInstance"
          :active-index="activeIndex"
          :pages="images.length"
          :class="{ 'pointer-events-none': !swiperReady }"
          arrow-buttons
        />
        <div
          v-if="!hideThumbnail"
          class="px-8 py-2 md:py-6 rounded-xl border border-black/[.12] bg-white shadow-[4px_32px_80px_0_rgba(191,194,203,0.24)]"
        >
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
