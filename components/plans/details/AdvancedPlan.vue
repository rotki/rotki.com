<template>
  <PlanBox :action="t('actions.get_advanced_plan')">
    <template #title>{{ t('home.plans.details.advanced.title') }}</template>
    {{ t('home.plans.details.advanced.subtitle') }}
  </PlanBox>
</template>

<script setup lang="ts">
const { t } = useI18n()
</script>
