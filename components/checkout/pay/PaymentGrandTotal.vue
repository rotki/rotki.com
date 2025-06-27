<script setup lang="ts">
defineProps<{
  grandTotal: number;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex items-center justify-between py-4 border-y border-default">
    <div class="text-rui-text-secondary">
      {{ t('home.plans.tiers.step_3.grand_total') }}
    </div>
    <div class="font-bold text-xl underline">
      € {{ grandTotal.toFixed(2) }}
    </div>
  </div>
</template>
