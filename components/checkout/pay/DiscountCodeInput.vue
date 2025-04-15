<script setup lang="ts">
const model = defineModel<string>({ required: true });

const { t } = useI18n();
</script>

<template>
  <RuiTextField
    v-model="model"
    color="primary"
    dense
    variant="outlined"
    :label="t('home.plans.tiers.step_3.discount.label')"
    :hint="t('home.plans.tiers.step_3.discount.hint')"
  />
</template>
