<script lang="ts" setup>
import UserDevicesTable from '~/components/account/home/UserDevicesTable.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Devices');

definePageMeta({
  auth: true,
  layout: 'account',
});
</script>

<template>
  <UserDevicesTable />
</template>
