<script setup lang="ts">
defineProps<{
  grandTotal: number;
  loading?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex items-center justify-between py-4 border-y border-default">
    <div class="text-rui-text-secondary">
      {{ t('home.plans.tiers.step_3.grand_total') }}
    </div>
    <div class="font-bold text-xl underline">
      <RuiSkeleton
        v-if="loading"
        :loading="loading"
        class="w-20 h-7"
        rounded
      >
        € {{ grandTotal.toFixed(2) }}
      </RuiSkeleton>
      <span v-else>
        € {{ grandTotal.toFixed(2) }}
      </span>
    </div>
  </div>
</template>
