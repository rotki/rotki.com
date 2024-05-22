<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { useDynamicMessages } from '~/composables/dynamic-message';

const description
  = 'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.';

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

const { fetchMessages, activeDashboardMessages } = useDynamicMessages();

onBeforeMount(() => {
  fetchMessages();
});

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <DynamicMessageDisplay
    v-if="activeDashboardMessages.length > 0"
    :messages="activeDashboardMessages"
  />
  <HomeBanner />
  <FeatureList />
  <Testimonials />
  <PremiumFeatures />
  <AvailablePlans />
</template>
