<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'account activation',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: '',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PendingActivation />
</template>
