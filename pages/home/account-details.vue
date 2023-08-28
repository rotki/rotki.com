<script lang="ts" setup>
definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <AccountDetails />
    <ChangePassword />
    <DangerZone />
  </div>
</template>
