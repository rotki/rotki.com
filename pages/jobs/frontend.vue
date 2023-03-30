<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'vue/typescript frontend developer | rotki';
const description =
  'We are looking for a passionate Vue.js developer with excellent knowledge of Typescript.';

const { baseUrl } = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/jobs/frontend`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <NuxtLayout name="jobs">
    <FrontendDeveloper />
  </NuxtLayout>
</template>
