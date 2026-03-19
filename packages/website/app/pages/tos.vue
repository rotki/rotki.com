<script setup lang="ts">
import MarkdownContent from '~/components/documents/MarkdownContent.vue';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Terms of Service',
  'Terms of service for rotki premium subscriptions and use of rotki.com.',
  '/tos',
);

definePageMeta({
  landing: true,
});
</script>

<template>
  <MarkdownContent path="/documents/terms-of-service" />
</template>
