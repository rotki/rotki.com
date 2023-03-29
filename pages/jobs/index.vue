<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'jobs | rotki';
const description = 'Available roles and positions in the rotki team';

const { baseUrl } = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/jobs`, baseUrl),
  ...commonAttrs(),
});

definePageMeta({
  redirect: '/jobs/backend',
});
</script>

<template>
  <JobsContent>
    <div />
  </JobsContent>
</template>
