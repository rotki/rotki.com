<script setup lang="ts">
import { useMarkdownContent } from '~/composables/markdown';

const { t } = useI18n();
const css = useCssModule();

const { loadTestimonials, testimonials } = useMarkdownContent();

await loadTestimonials();
</script>

<template>
  <div :class="css.testimonials">
    <div class="container">
      <div :class="css.title">{{ t('home.testimonials.title') }}</div>
      <div :class="css.detail">{{ t('home.testimonials.detail') }}</div>
      <TestimonialCarousel :testimonials="testimonials" />
    </div>
  </div>
</template>

<style lang="scss" module>
.testimonials {
  @apply py-20 w-full overflow-x-hidden bg-rui-primary-lighter/[0.04];
}

.title {
  @apply text-rui-text font-bold text-h4 mb-4;
}

.detail {
  @apply text-rui-text-secondary mb-16;
}
</style>
