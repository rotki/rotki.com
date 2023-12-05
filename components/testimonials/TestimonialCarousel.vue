<script setup lang="ts">
import { Autoplay } from 'swiper/modules';
import { SwiperSlide } from 'swiper/vue';
import { type Swiper, type SwiperOptions } from 'swiper/types';
import { get, set } from '@vueuse/core';
import { useMarkdownContent } from '~/composables/markdown';

const { loadTestimonials, testimonials } = useMarkdownContent();

const css = useCssModule();
const swiper = ref<Swiper>();
const pages = ref(get(swiper)?.snapGrid.length ?? 1);
const activeIndex = ref((get(swiper)?.activeIndex ?? 0) + 1);
const breakpoints: Record<number, SwiperOptions> = {
  // when window width is >= 320px
  320: {
    slidesPerView: 1.1,
    spaceBetween: 11,
  },
  425: {
    slidesPerView: 1.2,
    spaceBetween: 13,
  },
  640: {
    slidesPerView: 1.3,
    spaceBetween: 16,
  },
  768: {
    slidesPerView: 2,
    spaceBetween: 20,
  },
  1024: {
    slidesPerView: 2,
    spaceBetween: 20,
  },
  1280: {
    slidesPerView: 3,
    spaceBetween: 24,
  },
};

const onSwiperUpdate = (s: Swiper) => {
  set(swiper, s);
  set(activeIndex, s.activeIndex + 1);
  set(pages, s.snapGrid.length);
};

onMounted(async () => {
  await loadTestimonials();
});
</script>

<template>
  <div :class="css.content">
    <Carousel
      :autoplay="{
        delay: 10000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }"
      :breakpoints="breakpoints"
      :modules="[Autoplay]"
      :class="css.slider"
      auto-height
      @swiper="onSwiperUpdate($event)"
      @slide-change="onSwiperUpdate($event)"
    >
      <SwiperSlide v-for="(testimonial, i) in testimonials" :key="i">
        <Testimonial v-bind="testimonial" />
      </SwiperSlide>
    </Carousel>
    <CarouselControls
      v-if="swiper"
      v-model:swiper="swiper"
      :class="css.stepper"
      :active-index="activeIndex"
      :pages="pages"
    />
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex flex-col gap-4;

  .slider {
    @apply mb-12;
  }

  .stepper {
    @apply max-w-[17.5rem];
  }
}
</style>
