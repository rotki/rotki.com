<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'premium subscription';
const description = 'Features included with a premium rotki subscription';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/products/`, baseUrl),
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <ProductsHeading />
  <ProductsBlocks />
  <ProductsScreenshot />
  <ProductsLimits />
  <ProductsUnlockNudge />
  <ProductsAnalytics />
  <ProductsTimeframe />
  <ProductsFooter />
</template>
