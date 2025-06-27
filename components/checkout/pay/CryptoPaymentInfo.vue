<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
const notes = [
  t(`home.plans.tiers.step_3.notes.line_1`),
  t(`home.plans.tiers.step_3.notes.line_2`),
  t(`home.plans.tiers.step_3.notes.line_3`),
];
</script>

<template>
  <div :class="$style.container">
    <div
      v-for="(note, i) in notes"
      :key="i"
      :class="$style.row"
    >
      <div>
        <RuiChip
          color="primary"
          size="sm"
        >
          <span :class="$style.point">{{ i }}</span>
        </RuiChip>
      </div>
      <div :class="$style.description">
        {{ note }}
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
