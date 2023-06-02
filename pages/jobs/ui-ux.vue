<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'ui/ux | rotki';
const description = 'We are looking for a UI/UX designer';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/jobs/ui-ux`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <NuxtLayout name="jobs">
    <DesignerRole />
  </NuxtLayout>
</template>
