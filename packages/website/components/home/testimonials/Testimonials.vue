<script setup lang="ts">
import TestimonialCarousel from '~/components/home/testimonials/TestimonialCarousel.vue';
import { useRemoteOrLocal } from '~/composables/use-remote-or-local';

const { fallbackToLocalOnError } = useRemoteOrLocal();
const { data: testimonials } = await useAsyncData('testimonials', () => fallbackToLocalOnError(
  async () => await queryCollection('testimonialsRemote').all(),
  async () => await queryCollection('testimonialsLocal').all(),
));

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="py-20 w-full overflow-x-hidden bg-rui-primary-lighter/[0.04]">
    <div class="container">
      <div class="text-rui-text font-bold text-h4 mb-4">
        {{ t('home.testimonials.title') }}
      </div>
      <div class="text-rui-text-secondary mb-16">
        {{ t('home.testimonials.detail') }}
      </div>
      <TestimonialCarousel
        v-if="testimonials"
        :testimonials="testimonials"
      />
    </div>
  </div>
</template>
