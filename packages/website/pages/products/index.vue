<script setup lang="ts">
import ProductsAnalytics from '~/components/products/ProductsAnalytics.vue';
import ProductsBlocks from '~/components/products/ProductsBlocks.vue';
import ProductsFooter from '~/components/products/ProductsFooter.vue';
import ProductsHeading from '~/components/products/ProductsHeading.vue';
import ProductsLimits from '~/components/products/ProductsLimits.vue';
import ProductsMoneriumAndSync from '~/components/products/ProductsMoneriumAndSync.vue';
import ProductsTimeframe from '~/components/products/ProductsTimeframe.vue';
import ProductsUnlockNudge from '~/components/products/ProductsUnlockNudge.vue';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'premium subscription';
const description = 'Features included with a premium rotki subscription';

useHead({
  title,
  meta: getMetadata(title, description, '/products/'),
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
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
