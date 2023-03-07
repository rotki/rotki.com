<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'premium subscription features | rotki';
const description = 'Features included with a premium rotki subscription';

const config = useRuntimeConfig();
const baseUrl = config.baseUrl;
useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/products/`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <ProductsDetailPage />
</template>
