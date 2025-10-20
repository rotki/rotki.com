<script setup lang="ts">
const { months } = defineProps<{
  months?: number;
}>();

const { t } = useI18n();

const notes = computed(() => {
  const notes = [
    t('home.plans.tiers.step_1.notes.line_1'),
    t('home.plans.tiers.step_1.notes.line_2'),
    t('home.plans.tiers.step_1.notes.line_3'),
    t('home.plans.tiers.step_1.notes.line_4'),
  ];

  if (!months) {
    return notes;
  }

  return [
    t('home.plans.tiers.step_1.notes.line_5', {
      status: months === 12 ? t('home.plans.tiers.step_1.notes.yearly') : t('home.plans.tiers.step_1.notes.monthly'),
      period: months === 12 ? t('home.plans.tiers.step_1.notes.year') : t('home.plans.tiers.step_1.notes.month'),
    }),
    ...notes,
  ];
});
</script>

<template>
  <div class="flex flex-col gap-3 text-black/[.54] text-sm pt-6">
    <div
      v-for="(line, i) in notes"
      :key="i"
      class="flex gap-3"
    >
      <svg
        class="_rui-icon_z22yv_315 text-black/[.54] shrink-0"
        height="24"
        width="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2,12 a10,10 0 1,0 20,0 a10,10 0 1,0 -20,0 Z M12 16 L16 12 L12 8 M8 12h8"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill-rule="evenodd"
          clip-rule="evenodd"
        />
      </svg>
      <p>{{ line }}</p>
    </div>
  </div>
</template>
