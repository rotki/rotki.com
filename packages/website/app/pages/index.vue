<script setup lang="ts">
import DynamicMessageDisplay from '~/components/home/DynamicMessageDisplay.vue';
import FeatureList from '~/components/home/features/FeatureList.vue';
import HomeBanner from '~/components/home/HomeBanner.vue';
import PremiumFeatures from '~/components/home/PremiumFeatures.vue';
import Testimonials from '~/components/home/testimonials/Testimonials.vue';
import PricingSection from '~/components/pricings/PricingSection.vue';
import { useDynamicMessages } from '~/composables/use-dynamic-messages';
import { usePageSeo } from '~/composables/use-page-seo';

const description
  = 'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.';

const keywords = `portfolio,portfolio-tracking,cryptocurrency-portfolio-tracker,cryptocurrency,bitcoin,ethereum,
privacy,opensource,accounting,asset-management,taxes,tax-reporting`;

usePageSeo('rotki', description, '', { keywords });

const { fetchMessages, activeDashboardMessages } = useDynamicMessages();

onBeforeMount(() => {
  fetchMessages();
});

definePageMeta({
  landing: true,
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
  <PricingSection compact />
</template>
