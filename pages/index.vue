<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const description =
  'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.';

const keywords = `portfolio,portfolio-tracking,cryptocurrency-portfolio-tracker,cryptocurrency,bitcoin,ethereum,
privacy,opensource,accounting,asset-management,taxes,tax-reporting`;

const config = useRuntimeConfig();
const baseUrl = config.baseUrl;
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
const { visible } = useOverflow();
</script>

<template>
  <HeaderArea landing />
  <HeroArea @download="visible = true" />
  <FeatureList @download="visible = true" />
  <PremiumFeatures />
  <AvailablePlans @download="visible = true" />
  <PageFooter landing />
  <!--  <DownloadDialog v-if="visible" @dismiss="visible = false" />-->
</template>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
