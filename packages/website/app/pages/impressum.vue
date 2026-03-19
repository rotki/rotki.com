<script setup lang="ts">
import MarkdownContent from '~/components/documents/MarkdownContent.vue';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Impressum',
  'Legal disclosure (Impressum) for Rotki Solutions GmbH.',
  '/impressum',
);

definePageMeta({
  landing: true,
});
</script>

<template>
  <MarkdownContent path="/documents/impressum" />
</template>
