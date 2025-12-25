<script setup lang="ts">
import { useStagingBranding } from '~/composables/use-staging-branding';
import { commonAttrs } from '~/utils/metadata';

useStagingBranding();

const { public: { baseUrl } } = useRuntimeConfig();

// Global fallback for OG image.
const ogImageUrl = `${baseUrl}/img/og/share.png`;

useHead(() => ({
  meta: [
    { property: 'og:image', content: ogImageUrl },
    { property: 'twitter:image', content: ogImageUrl },
  ],
  ...commonAttrs(),
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
