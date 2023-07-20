<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <RuiAlert
    type="warning"
    :description="t('account.unverified_email.message')"
  />
</template>
