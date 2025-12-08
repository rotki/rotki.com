<script setup lang="ts">
import PasswordForm from '~/components/account/password/PasswordForm.vue';
import { commonAttrs } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'password recovery',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Recover your rotki.com account password',
    },
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PasswordForm />
</template>
