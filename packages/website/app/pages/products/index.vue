<script setup lang="ts">
import CampaignRibbon from '@rotki/checkout-ui/components/CampaignRibbon.vue';
import { useI18n } from 'vue-i18n';
import { defineLazyHydrationComponent } from '#app/composables/lazy-hydration';
import { definePageMeta } from '#app/composables/pages';
import ProductsBlocks from '~/components/products/ProductsBlocks.vue';
import ProductsHeading from '~/components/products/ProductsHeading.vue';
import { useAppConfig } from '~/composables/use-app-config';
import { usePageSeo } from '~/composables/use-page-seo';

// Prerendered as usual; the code below the first screen loads when it scrolls into view.
const ProductsNewFeatures = defineLazyHydrationComponent('visible', () => import('~/components/products/ProductsNewFeatures.vue'));
const ProductsAnalytics = defineLazyHydrationComponent('visible', () => import('~/components/products/ProductsAnalytics.vue'));
const ProductsLimits = defineLazyHydrationComponent('visible', () => import('~/components/products/ProductsLimits.vue'));
const ProductsTimeframe = defineLazyHydrationComponent('visible', () => import('~/components/products/ProductsTimeframe.vue'));
const PricingSection = defineLazyHydrationComponent('visible', () => import('~/components/pricings/PricingSection.vue'));
const ProductsFooter = defineLazyHydrationComponent('visible', () => import('~/components/products/ProductsFooter.vue'));

const { t } = useI18n({ useScope: 'global' });

const { activeCampaign } = useAppConfig();

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
  <CampaignRibbon
    v-if="activeCampaign"
    :campaign="activeCampaign"
  />
  <ProductsHeading />
  <ProductsBlocks />
  <ProductsNewFeatures />
  <ProductsAnalytics />
  <ProductsLimits />
  <ProductsTimeframe />
  <section class="pt-14 lg:pt-20">
    <div class="container flex flex-col items-center text-center gap-3 mb-14">
      <h2 class="text-h3 font-bold!">
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
