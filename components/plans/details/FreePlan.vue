<script setup lang="ts">
const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <PlanBox :action="t('actions.start_now_for_free')" url="/download">
    <template #title>{{ t('home.plans.details.free.title') }}</template>
    {{ t('home.plans.details.free.subtitle') }}
    <div :class="css.filler" />
  </PlanBox>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.filler {
  height: 100%;
}
</style>
