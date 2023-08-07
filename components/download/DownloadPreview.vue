<script lang="ts" setup>
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { SwiperSlide } from 'swiper/vue';
import { type Swiper } from 'swiper/types';
import { Autoplay } from 'swiper/modules';
import { get, set } from '@vueuse/core';

const { t } = useI18n();
const css = useCssModule();

const swiper = ref<Swiper>();
const pages = ref(get(swiper)?.snapGrid.length ?? 1);
const activeIndex = ref((get(swiper)?.activeIndex ?? 0) + 1);

const images = ref([]);

const scanImages = () => {
  const assetContext = import.meta.glob(
    '~/public/img/download/*.(png|jpe?g|webp)',
  );

  const assetPaths = Object.keys(assetContext).map((path) =>
    path.replace('/public/img', '/img'),
  );

  set(images, assetPaths);
};

const onSwiperUpdate = (s: Swiper) => {
  set(swiper, s);
  set(activeIndex, s.activeIndex + 1);
  set(pages, s.snapGrid.length);
};

scanImages();
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.wrapper__container" class="container">
      <Carousel
        :autoplay="{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }"
        :modules="[Autoplay]"
        auto-height
        :class="css.slider"
        @swiper="onSwiperUpdate($event)"
        @slide-change="onSwiperUpdate($event)"
      >
        <SwiperSlide v-for="(image, i) in images" :key="i">
          <img :src="image" alt=" " class="w-full" />
        </SwiperSlide>
      </Carousel>
      <div class="container relative">
        <div :class="css.controls">
          <CarouselControls
            v-if="swiper"
            v-model:swiper="swiper"
            :active-index="activeIndex"
            :pages="pages"
          />
          <div :class="css.preview">
            {{ t('download.preview') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply py-10 lg:py-20 mb-[2.8125rem];

  &__container {
    @apply flex flex-col relative;

    .slider {
      @apply rounded-3xl border border-black/[0.12];
    }

    .controls {
      @apply flex flex-col absolute -bottom-[1.75rem] md:-bottom-[3rem] z-10 -left-2 -right-2 md:-left-6 md:-right-6 items-center justify-center;

      .preview {
        @apply mt-2 md:mt-0 px-8 py-2 md:py-6 rounded-xl border border-black/[.12] bg-white text-h5 md:text-h4 font-medium;
        box-shadow: 4px 32px 80px 0 rgba(191, 194, 203, 0.24);
      }
    }
  }
}
</style>
