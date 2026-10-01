<script lang="ts" setup>
const { total = 0 } = defineProps<{
  total?: number;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col items-center gap-3 text-center mb-8 lg:mb-10">
    <p class="text-rui-primary text-subtitle-1 font-medium">
      {{ t('sponsor.leaderboard.eyebrow') }}
    </p>
    <h1 class="text-h4 md:text-h3 !font-bold text-balance">
      {{ t('sponsor.leaderboard.title') }}
    </h1>
    <p class="text-body-1 text-rui-text-secondary max-w-[520px] text-balance">
      {{ t('sponsor.leaderboard.subtitle') }}
    </p>
    <!-- Reserves its line while the first page loads so the list below does not jump -->
    <div class="min-h-8 flex items-center">
      <span
        v-if="total > 0"
        class="inline-flex items-center gap-2 rounded-full border border-rui-grey-200 px-3 py-1 text-body-2 text-rui-text-secondary"
      >
        <RuiIcon
          name="lu-heart"
          size="14"
          class="text-rui-primary"
        />
        {{ t('sponsor.leaderboard.sponsor_count', { count: total }, total) }}
      </span>
    </div>
  </div>
</template>
