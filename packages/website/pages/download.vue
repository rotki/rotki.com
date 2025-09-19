<script lang="ts" setup>
import type { DownloadItem } from '~/types/download';
import { get } from '@vueuse/core';
import { useAppDownload } from '~/composables/download';
import { commonAttrs } from '~/utils/metadata';

useHead({
  title: 'download',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Download rotki',
    },
  ],
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
