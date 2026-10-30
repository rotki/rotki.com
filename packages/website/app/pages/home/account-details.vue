<script lang="ts" setup>
import AccountDetails from '~/components/account/home/AccountDetails.vue';
import ChangePassword from '~/components/account/home/ChangePassword.vue';
import DangerZone from '~/components/account/home/DangerZone.vue';
import EmailPreferences from '~/components/account/home/EmailPreferences.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Account');

definePageMeta({
  auth: true,
  layout: 'account',
});
</script>

<template>
  <div class="max-w-2xl space-y-12">
    <AccountDetails />
    <ChangePassword />
    <EmailPreferences />
    <DangerZone />
  </div>
</template>
