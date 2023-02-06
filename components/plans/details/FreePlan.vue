<template>
  <PlanBox :action="t('actions.download')" @click="emit('download')">
    <template #title>{{ t('home.plans.details.free.title') }}</template>
    {{ t('home.plans.details.free.subtitle') }}
    <div :class="css.filler"></div>
  </PlanBox>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'download'): void }>()

const { t } = useI18n()
const css = useCssModule()
</script>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.filler {
  height: 100%;
}
</style>
