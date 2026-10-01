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
  'Download rotki for Windows, macOS and Linux',
  'Download rotki, the free and open source crypto portfolio tracker, for Windows, macOS or Linux, or run it with Docker. Your data stays encrypted on your device.',
  '/download',
);

const { public: { baseUrl } } = useRuntimeConfig();
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${baseUrl}/#software`,
      'name': 'rotki',
      'applicationCategory': 'FinanceApplication',
      'operatingSystem': 'Windows, macOS, Linux',
      'url': `${baseUrl}/`,
      'downloadUrl': `${baseUrl}/download`,
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'EUR',
      },
      'publisher': { '@id': `${baseUrl}/#organization` },
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

const { t } = useI18n({ useScope: 'global' });

const links = computed<DownloadItem[]>(() => [
  { platform: 'LINUX', label: 'Linux', caption: t('download.platforms.linux'), image: '/img/linux.svg', group: true, items: [{
    name: 'Linux AppImage',
    analyticsKey: 'LINUX AppImage',
    variant: 'AppImage',
    url: get(linuxAppImageUrl),
  }, {
    name: 'Linux deb',
    analyticsKey: 'LINUX deb',
    variant: '.deb',
    url: get(linuxDebUrl),
  }] },
  { platform: 'MAC', label: 'macOS', caption: t('download.platforms.mac'), icon: 'lu-os-apple', group: true, items: [{
    name: 'macOS Apple Silicon',
    analyticsKey: 'MAC Apple Silicon',
    variant: 'Apple Silicon',
    url: get(macOSArmUrl),
  }, {
    name: 'macOS Intel',
    analyticsKey: 'MAC Intel',
    variant: 'Intel',
    url: get(macOSUrl),
  }] },
  { platform: 'WINDOWS', label: 'Windows', caption: t('download.platforms.windows'), icon: 'lu-os-windows', url: get(windowsUrl) },
  { platform: 'DOCKER', label: 'Docker', caption: t('download.platforms.docker'), image: '/img/docker.svg', url: 'https://docs.rotki.com/requirement-and-installation/packaged-binaries.html#docker', command: 'docker pull rotki/rotki' },
]);

definePageMeta({
  landing: true,
});
</script>

<template>
  <DownloadHeading
    :links="links"
    :version="version"
    :loading="loading"
  />
  <DownloadDocs />
  <DownloadPreview />
  <DownloadUpgradeNudge />
</template>
