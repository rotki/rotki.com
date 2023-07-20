<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const description =
  'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.';

const keywords = `portfolio,portfolio-tracking,cryptocurrency-portfolio-tracker,cryptocurrency,bitcoin,ethereum,
privacy,opensource,accounting,asset-management,taxes,tax-reporting`;

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title: 'rotki',
  meta: [
    {
      name: 'keywords',
      content: keywords,
    },
    ...getMetadata('rotki', description, baseUrl, baseUrl),
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <HeroArea />
  <FeatureList />
  <PremiumFeatures />
  <AvailablePlans />
</template>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
