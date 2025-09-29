<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

const notes = computed<string[]>(() => [
  t('home.plans.tiers.step_3.notes.line_1'),
  t('home.plans.tiers.step_3.notes.line_2'),
  t('home.plans.tiers.step_3.notes.line_3'),
]);
</script>

<template>
  <div class="mt-8 text-body-2">
    <div
      v-for="(note, i) in notes"
      :key="i"
      class="flex flex-row mt-5 gap-2"
    >
      <div>
        <RuiChip
          color="primary"
          size="sm"
        >
          <span class="h-6 flex items-center justify-center">{{ i + 1 }}</span>
        </RuiChip>
      </div>
      <div>
        {{ note }}
      </div>
    </div>
  </div>
</template>
