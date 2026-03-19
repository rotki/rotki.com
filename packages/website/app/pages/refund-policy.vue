<script setup lang="ts">
import MarkdownContent from '~/components/documents/MarkdownContent.vue';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Refund Policy',
  'Refund policy for rotki premium subscriptions — conditions, timeframes, and how to request a refund.',
  '/refund-policy',
);

definePageMeta({
  landing: true,
});
</script>

<template>
  <MarkdownContent path="/documents/refund-policy" />
</template>
