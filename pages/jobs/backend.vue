<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'python backend developer | rotki';
const description =
  'We are looking for a backend developer to help us improve Rotki.';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/jobs/backend`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <NuxtLayout name="jobs">
    <BackendDeveloper />
  </NuxtLayout>
</template>
