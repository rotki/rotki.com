<script lang="ts" setup>
import AccountDetails from '~/components/account/home/AccountDetails.vue';
import ChangePassword from '~/components/account/home/ChangePassword.vue';
import DangerZone from '~/components/account/home/DangerZone.vue';

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <div class="flex flex-col gap-5">
    <AccountDetails />
    <ChangePassword />
    <DangerZone />
  </div>
</template>
