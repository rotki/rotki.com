<script setup lang="ts">
import { useMarkdownContent } from '~/composables/markdown';

const { t } = useI18n();
const css = useCssModule();

const { loadTestimonials, testimonials } = useMarkdownContent();

await loadTestimonials();
</script>

<template>
  <div :class="css.testimonials">
    <div :class="css.wrapper">
      <div :class="css.title">{{ t('home.testimonials.title') }}</div>
      <div :class="css.detail">{{ t('home.testimonials.detail') }}</div>
      <TestimonialCarousel :testimonials="testimonials" />
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';

.testimonials {
  @apply pt-20 pb-80 w-full overflow-x-hidden bg-rui-primary/[0.04] -mb-[19rem];
}

.wrapper {
  @apply container;
}

.title {
  @apply text-rui-text font-bold text-h4 mb-4;
}

.detail {
  @apply text-rui-text-secondary mb-16;
}
</style>
