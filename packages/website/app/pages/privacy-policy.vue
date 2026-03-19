<script setup lang="ts">
import MarkdownContent from '~/components/documents/MarkdownContent.vue';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Privacy Policy',
  'rotki privacy policy — how we collect, use, and protect your personal data.',
  '/privacy-policy',
);

definePageMeta({
  landing: true,
});
</script>

<template>
  <MarkdownContent path="/documents/privacy-policy" />
</template>
