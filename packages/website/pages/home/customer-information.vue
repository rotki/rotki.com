<script lang="ts" setup>
import AccountInformation from '~/components/account/home/AccountInformation.vue';

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <AccountInformation />
</template>
