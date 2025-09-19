<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <PlanBox :action="t('actions.get_advanced_plan')">
    <template #title>
      {{ t('home.plans.details.advanced.title') }}
    </template>
    {{ t('home.plans.details.advanced.subtitle') }}
  </PlanBox>
</template>
