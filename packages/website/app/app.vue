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
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'rotki',
      'url': baseUrl,
      'logo': `${baseUrl}/android-chrome-512x512.png`,
      'sameAs': [
        'https://twitter.com/rotkiapp',
        'https://github.com/rotki',
        'https://www.reddit.com/r/rotki',
      ],
    }),
  }],
  ...commonAttrs(),
}));
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
