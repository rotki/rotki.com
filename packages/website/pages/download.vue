<script lang="ts" setup>
import type { DownloadItem } from '~/types/download';
import { get } from '@vueuse/core';
import DownloadDocs from '~/components/download/DownloadDocs.vue';
import DownloadHeading from '~/components/download/DownloadHeading.vue';
import DownloadPreview from '~/components/download/DownloadPreview.vue';
import { useAppDownload } from '~/composables/use-app-download';
import { commonAttrs, getMetadata } from '~/utils/metadata';

useHead({
  title: 'download',
  meta: getMetadata('rotki', 'Download rotki', '/download'),
  ...commonAttrs(),
});

const {
  version,
  linuxUrl,
  macOSUrl,
  macOSArmUrl,
  windowsUrl,
  fetchLatestRelease,
} = useAppDownload();

const links = computed<DownloadItem[]>(() => [
  { platform: 'LINUX', image: '/img/linux.svg', url: get(linuxUrl) },
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

onBeforeMount(async () => await fetchLatestRelease());

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <DownloadHeading
    :links="links"
    :version="version"
  />
  <DownloadDocs />
  <DownloadPreview />
</template>
