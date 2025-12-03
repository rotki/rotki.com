<script lang="ts" setup>
import AccountAddress from '~/components/account/home/AccountAddress.vue';

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <AccountAddress />
</template>
