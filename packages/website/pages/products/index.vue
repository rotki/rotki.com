<script setup lang="ts">
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
