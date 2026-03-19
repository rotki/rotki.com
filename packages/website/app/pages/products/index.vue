<script setup lang="ts">
import ProductsAnalytics from '~/components/products/ProductsAnalytics.vue';
import ProductsBlocks from '~/components/products/ProductsBlocks.vue';
import ProductsFooter from '~/components/products/ProductsFooter.vue';
import ProductsHeading from '~/components/products/ProductsHeading.vue';
import ProductsLimits from '~/components/products/ProductsLimits.vue';
import ProductsMoneriumAndSync from '~/components/products/ProductsMoneriumAndSync.vue';
import ProductsTimeframe from '~/components/products/ProductsTimeframe.vue';
import ProductsUnlockNudge from '~/components/products/ProductsUnlockNudge.vue';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Premium Subscription',
  'Discover rotki premium features — encrypted data backups, multi-device sync, ETH staking tracking, detailed graphs, and more.',
  '/products',
);

definePageMeta({
  landing: true,
});
</script>

<template>
  <ProductsHeading />
  <ProductsBlocks />
  <ProductsLimits />
  <ProductsUnlockNudge />
  <ProductsAnalytics />
  <ProductsTimeframe />
  <ProductsMoneriumAndSync />
  <ProductsFooter />
</template>
