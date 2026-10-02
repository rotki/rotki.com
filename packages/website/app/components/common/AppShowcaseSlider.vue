<script setup lang="ts">
import type { Swiper } from 'swiper/types';
import { get, set } from '@vueuse/shared';
import { SwiperSlide } from 'swiper/vue';
import screenshots from 'virtual:app-screenshots';
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
  '1-sc-dashboard': 'rotki dashboard showing net worth over time and balances per location',
  '2-sc-history-events': 'rotki history events with decoded transactions and the filter bar',
  '3-sc-pnl-report': 'rotki profit and loss report overview',
  '4-sc-statistics': 'rotki statistics showing net worth and asset value over time',
  '5-sc-actions-center': 'rotki actions center listing transfers that still need matching',
  '6-sc-mcp': 'rotki MCP settings for connecting an AI assistant',
  '7-sc-kraken-staking': 'rotki Kraken staking overview with rewards per asset',
};

function getAltText(path: string): string {
  const filename = path.split('/').pop()?.replace(/\.\w+$/, '') ?? '';
  return screenshotAltTexts[filename] ?? 'rotki application screenshot';
}

/**
 * Slide list, discovered at build time by the `app-screenshots` module.
 *
 * This used to be an `import.meta.glob` over `public/img/screenshots`, which
 * cannot work: Vite deliberately keeps `public/` out of the module graph. It
 * looked fine because the dev server resolves such patterns off the filesystem,
 * while the build compiled it down to `Object.assign({})` and the carousel
 * rendered zero slides in production.
 */
const images = ref<ScreenshotImage[]>(
  screenshots.map(src => ({ src, alt: getAltText(src) })),
);

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
 * Responsive srcset for every slide. Pre-generated width variants live in a
 * `responsive/` subfolder (the module only lists files directly in the
 * screenshots folder), so every screenshot needs its 640w, 960w and 1440w
 * variants there; the original webp is the 2880w source. Phones pull a
 * ~13-37KB variant instead of the 87-150KB source.
 *
 * For `/img/screenshots/1-sc-dashboard.webp` the variants are
 * `/img/screenshots/responsive/1-sc-dashboard-640w.webp` and so on.
 */
function getSrcset(image: ScreenshotImage): string {
  const base = image.src.replace(/\/([^/]+)\.webp$/, '/responsive/$1');
  return `${base}-640w.webp 640w, ${base}-960w.webp 960w, ${base}-1440w.webp 1440w, ${image.src} 2880w`;
}

const imageSizes = '(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px';

/**
 * Preloads the LCP image with the same srcset and sizes as the `<img>`, so the
 * browser picks the same variant for both. A plain `href` preload fetched the
 * 2880w original while the `<img>` then downloaded a smaller variant too.
 */
const firstImage = get(images)[0];
if (firstImage) {
  useHead({
    link: [{
      as: 'image',
      fetchpriority: 'high',
      href: firstImage.src,
      imagesizes: imageSizes,
      imagesrcset: getSrcset(firstImage),
      rel: 'preload',
      type: 'image/webp',
    }],
  });
}
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
          :srcset="getSrcset(image)"
          :sizes="imageSizes"
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
