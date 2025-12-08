<script setup lang="ts">
import AccountDeletedPage from '~/components/account/delete/AccountDeletedPage.vue';
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'account deleted',
  meta: [
    {
      name: 'description',
      content: 'Your account has been successfully deleted',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <AccountDeletedPage />
</template>
