<script setup lang="ts">
const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <div :class="css.container">
    <div v-for="i in 3" :key="i" :class="css.row">
      <div>
        <RuiChip color="primary" size="sm">
          <span :class="css.point">{{ i }}</span>
        </RuiChip>
      </div>
      <div :class="css.description">
        {{ t(`home.plans.tiers.step_3.notes.${i}`) }}
      </div>
    </div>
  </div>
</template>

<style module lang="scss">
.container {
  @apply mt-8 text-body-2;
}

.row {
  @apply flex flex-row mt-5 gap-2;
}

.point {
  @apply h-6 flex items-center justify-center;
}
</style>
