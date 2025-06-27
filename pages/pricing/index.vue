<script setup lang="ts">
import PricingSection from '~/components/pricings/PricingSection.vue';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'rotki pricing';
const description = 'Pricing page for rotki subscription';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/pricing/`, baseUrl),
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <PricingHeading />
  <PricingSection />
</template>
