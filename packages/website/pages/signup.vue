<script setup lang="ts">
import SignupForm from '~/components/account/signup/SignupForm.vue';
import { commonAttrs } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'signup',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Create a new rotki premium account',
    },
  ],
  ...commonAttrs(),
});
</script>

<template>
  <SignupForm />
</template>
