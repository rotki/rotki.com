<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const title = 'privacy policy | rotki';
const description =
  'Information for the website visitors regarding our policies with the collection, use, and disclosure of Personal Information regarding the service usage';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/privacy-policy/`, baseUrl),
  ...commonAttrs(),
});
</script>

<template>
  <PrivacyPolicyContent />
</template>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
