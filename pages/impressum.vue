<script setup lang="ts">
import { commonAttrs, getMetadata } from '@/utils/metadata';

const title = 'impressum | rotki';
const description = 'Impressum - DE';

const config = useRuntimeConfig();
const baseUrl = config.baseUrl;
useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/impressum/`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <ImpressumContent />
</template>

<style lang="scss">
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';
</style>
