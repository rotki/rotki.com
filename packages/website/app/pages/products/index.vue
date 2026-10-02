<script setup lang="ts">
import CampaignRibbon from '~/components/common/CampaignRibbon.vue';
import PricingSection from '~/components/pricings/PricingSection.vue';
import ProductsAnalytics from '~/components/products/ProductsAnalytics.vue';
import ProductsBlocks from '~/components/products/ProductsBlocks.vue';
import ProductsFooter from '~/components/products/ProductsFooter.vue';
import ProductsHeading from '~/components/products/ProductsHeading.vue';
import ProductsLimits from '~/components/products/ProductsLimits.vue';
import ProductsNewFeatures from '~/components/products/ProductsNewFeatures.vue';
import ProductsTimeframe from '~/components/products/ProductsTimeframe.vue';
import { usePageSeo } from '~/composables/use-page-seo';

const { t } = useI18n({ useScope: 'global' });

usePageSeo(
  'rotki Premium: higher limits, analytics and sync',
  'rotki Premium: Basic and Advanced add higher limits, graphs, staking insights, AI assistant access and encrypted sync. Supporter backs the project.',
  '/products',
);

definePageMeta({
  landing: true,
});
</script>

<template>
  <CampaignRibbon />
  <ProductsHeading />
  <ProductsBlocks />
  <ProductsNewFeatures />
  <ProductsAnalytics />
  <ProductsLimits />
  <ProductsTimeframe />
  <section class="pt-14 lg:pt-20">
    <div class="container flex flex-col items-center text-center gap-3 mb-14">
      <h2 class="text-h4 !font-bold">
        {{ t('products.pricing.title') }}
      </h2>
      <p class="text-body-1 text-rui-text-secondary max-w-[560px]">
        {{ t('products.pricing.detail') }}
      </p>
    </div>
    <PricingSection compact />
  </section>
  <ProductsFooter />
</template>
