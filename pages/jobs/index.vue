<script lang="ts" setup>
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'jobs';
const description = 'Available roles and positions in the rotki team';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/jobs`, baseUrl),
  ...commonAttrs(),
});

definePageMeta({
  middleware: 'redirects',
});
</script>

<template>
  <NuxtLayout name="jobs">
    <div>
      <TextParagraph>There are no open roles.</TextParagraph>
    </div>
  </NuxtLayout>
</template>
