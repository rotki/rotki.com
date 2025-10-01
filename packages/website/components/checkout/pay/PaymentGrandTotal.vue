<script setup lang="ts">
defineProps<{
  grandTotal: number;
  loading?: boolean;
  upgrade?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div>
    <div class="flex items-center justify-between py-4 border-y border-default">
      <div class="text-rui-text-secondary">
        {{ t('home.plans.tiers.step_3.grand_total') }}
      </div>
      <div class="font-bold text-xl underline">
        <RuiSkeletonLoader
          v-if="loading"
          :loading="loading"
          class="w-20 h-7"
        >
          € {{ grandTotal.toFixed(2) }}
        </RuiSkeletonLoader>
        <span v-else>
          € {{ grandTotal.toFixed(2) }}
        </span>
      </div>
    </div>

    <RuiAlert
      v-if="upgrade"
      class="mt-4"
      type="info"
    >
      {{ t('home.plans.tiers.step_3.upgrade_plan_description') }}
    </RuiAlert>
  </div>
</template>
