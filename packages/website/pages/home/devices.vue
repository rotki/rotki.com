<script lang="ts" setup>
import UserDevicesTable from '~/components/account/home/UserDevicesTable.vue';

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <UserDevicesTable />
</template>
