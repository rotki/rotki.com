<script lang="ts" setup>
import AccountDetails from '~/components/account/home/AccountDetails.vue';
import ChangePassword from '~/components/account/home/ChangePassword.vue';
import DangerZone from '~/components/account/home/DangerZone.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Account Details');

definePageMeta({
  auth: true,
  layout: 'account',
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <AccountDetails />
    <ChangePassword />
    <DangerZone />
  </div>
</template>
