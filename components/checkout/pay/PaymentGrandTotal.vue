<script setup lang="ts">
defineProps<{
  grandTotal: number;
  upgrade?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between py-4 border-y border-default">
      <div class="text-rui-text-secondary">
        {{ t('home.plans.tiers.step_3.grand_total') }}
      </div>
      <div class="font-bold text-xl underline">
        € {{ grandTotal.toFixed(2) }}
      </div>
    </div>

    <RuiAlert
      v-if="upgrade"
      type="info"
    >
      {{ t('home.plans.tiers.step_3.upgrade_plan_description') }}
    </RuiAlert>
  </div>
</template>
