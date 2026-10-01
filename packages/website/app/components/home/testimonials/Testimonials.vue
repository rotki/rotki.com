<script setup lang="ts">
import TestimonialCarousel from '~/components/home/testimonials/TestimonialCarousel.vue';

const { data: testimonials } = await useAsyncData('testimonials', () => queryCollection('testimonials').order('order', 'DESC').all(), { dedupe: 'defer' });

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <section class="py-16 md:py-24 w-full overflow-x-hidden">
    <div class="container">
      <h2 class="text-rui-text !font-bold text-h4 mb-4">
        {{ t('home.testimonials.title') }}
      </h2>
      <p class="text-body-1 text-rui-text-secondary mb-12">
        {{ t('home.testimonials.detail') }}
      </p>
      <TestimonialCarousel
        v-if="testimonials"
        :testimonials="testimonials"
      />
    </div>
  </section>
</template>
