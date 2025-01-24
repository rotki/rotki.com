<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs } from '~/utils/metadata';
import { useAppDownload } from '~/composables/download';
import type { DownloadItemProps } from '~/components/download/DownloadItem.vue';

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

const links = computed<DownloadItemProps[]>(() => [
  { platform: 'LINUX', icon: 'lu-cloud-download-2-fill', url: get(linuxUrl) },
  { platform: 'MAC apple silicon', icon: 'lu-os-apple', url: get(macOSArmUrl) },
  { platform: 'MAC intel', icon: 'lu-os-apple', url: get(macOSUrl) },
  { platform: 'WINDOWS', icon: 'lu-os-windows', url: get(windowsUrl) },
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
