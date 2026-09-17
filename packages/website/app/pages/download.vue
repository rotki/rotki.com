<script lang="ts" setup>
import type { DownloadItem } from '~/types/download';
import { get } from '@vueuse/shared';
import DownloadDocs from '~/components/download/DownloadDocs.vue';
import DownloadHeading from '~/components/download/DownloadHeading.vue';
import DownloadPreview from '~/components/download/DownloadPreview.vue';
import DownloadUpgradeNudge from '~/components/download/DownloadUpgradeNudge.vue';
import { useAppDownload } from '~/composables/use-app-download';
import { usePageSeo } from '~/composables/use-page-seo';

usePageSeo(
  'Download',
  'Download rotki for Linux, macOS, or Windows. Free, open-source portfolio tracking and accounting software that protects your privacy.',
  '/download',
);

const { public: { baseUrl } } = useRuntimeConfig();
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'rotki',
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Windows, macOS, Linux',
      'url': `${baseUrl}/download`,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'EUR',
      },
    }),
  }],
});

const {
  version,
  linuxAppImageUrl,
  linuxDebUrl,
  macOSUrl,
  macOSArmUrl,
  windowsUrl,
  loading,
} = useAppDownload();

const links = computed<DownloadItem[]>(() => [
  { platform: 'LINUX', image: '/img/linux.svg', group: true, items: [{
    name: 'LINUX AppImage',
    url: get(linuxAppImageUrl),
  }, {
    name: 'LINUX deb',
    url: get(linuxDebUrl),
  }] },
  { platform: 'MAC', icon: 'lu-os-apple', group: true, items: [{
    name: 'MAC Apple Silicon',
    url: get(macOSArmUrl),
  }, {
    name: 'MAC Intel',
    url: get(macOSUrl),
  }] },
  { platform: 'WINDOWS', icon: 'lu-os-windows', url: get(windowsUrl) },
  { platform: 'DOCKER', image: '/img/docker.svg', url: 'https://docs.rotki.com/requirement-and-installation/packaged-binaries.html#docker', command: 'docker pull rotki/rotki' },
]);

definePageMeta({
  landing: true,
});
</script>

<template>
  <DownloadUpgradeNudge />
  <DownloadHeading
    :links="links"
    :version="version"
    :loading="loading"
  />
  <DownloadDocs />
  <DownloadPreview />
</template>
