<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PlanBox :action="t('actions.get_premium_plan')" url="/products/" recommended>
    <template #title>{{ t('home.plans.details.premium.title') }}</template>
    {{ t('home.plans.details.premium.subtitle') }}
  </PlanBox>
</template>
