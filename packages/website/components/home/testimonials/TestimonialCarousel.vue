<script setup lang="ts">
import type { TestimonialsLocalCollectionItem, TestimonialsRemoteCollectionItem } from '@nuxt/content';
import type { Swiper, SwiperOptions } from 'swiper/types';
import { get, set } from '@vueuse/core';
import { SwiperSlide } from 'swiper/vue';
import Carousel from '~/components/common/carousel/Carousel.vue';
import CarouselControls from '~/components/common/carousel/CarouselControls.vue';
import Testimonial from '~/components/home/testimonials/Testimonial.vue';

defineProps<{
  testimonials: TestimonialsLocalCollectionItem[] | TestimonialsRemoteCollectionItem[];
}>();

const swiperInstance = ref<Swiper>();
const pages = ref(get(swiperInstance)?.snapGrid.length ?? 1);
const activeIndex = ref((get(swiperInstance)?.activeIndex ?? 0) + 1);
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

function onSwiperUpdate(s: Swiper) {
  set(swiperInstance, s);
  set(activeIndex, s.activeIndex + 1);
  set(pages, s.snapGrid.length);
}
</script>

<template>
  <div :class="$style.content">
    <Carousel
      :autoplay="{
        delay: 10000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      }"
      :breakpoints="breakpoints"
      :class="$style.slider"
      auto-height
      @swiper="onSwiperUpdate($event)"
      @slide-change="onSwiperUpdate($event)"
    >
      <SwiperSlide
        v-for="(testimonial, i) in testimonials"
        :key="i"
      >
        <Testimonial
          :avatar="testimonial.avatar"
          :body="testimonial.body"
          :url="testimonial.url"
          :username="testimonial.username"
        />
      </SwiperSlide>
    </Carousel>
    <CarouselControls
      v-if="swiperInstance"
      v-model:swiper="swiperInstance"
      :class="$style.stepper"
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
