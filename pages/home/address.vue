<script lang="ts" setup>
definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <AccountAddress />
</template>
