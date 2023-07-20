<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs } from '~/utils/metadata';
import { useAppDownload } from '~/composables/download';
import { type DownloadItemProps } from '~/components/download/DownloadItem.vue';

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
  { platform: 'LINUX', icon: 'download-cloud-2-line', url: get(linuxUrl) },
  { platform: 'MAC apple silicon', icon: 'apple-line', url: get(macOSArmUrl) },
  { platform: 'MAC intel', icon: 'apple-line', url: get(macOSUrl) },
  { platform: 'WINDOWS', icon: 'windows-line', url: get(windowsUrl) },
]);

onBeforeMount(async () => await fetchLatestRelease());

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <DownloadHeading :links="links" :version="version" />
  <DownloadDocs />
  <DownloadPreview />
</template>

<style lang="scss">
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';
</style>
