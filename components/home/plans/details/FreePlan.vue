<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PlanBox
    :action="t('actions.start_now_for_free')"
    url="/download"
    button-variant="outlined"
  >
    <template #title>
      {{ t('home.plans.details.free.title') }}
    </template>
    <template #price>
      {{ t('home.plans.details.free.price') }}
    </template>
    {{ t('home.plans.details.free.subtitle') }}
  </PlanBox>
</template>
