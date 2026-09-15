<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import PricingTableButton from '~/components/pricings/PricingTableButton.vue';
import PricingTableCell from '~/components/pricings/PricingTableCell.vue';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';

defineProps<{
  plan: MappedPlan;
  featuresLabel: string[];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col">
    <div class="px-4 py-6 xl:px-6 xl:py-10 flex flex-col justify-between flex-1">
      <div class="flex flex-col gap-2 mb-6">
        <template v-if="plan.loading">
          <RuiSkeletonLoader class="w-32 h-8" />
          <div class="flex items-end gap-x-1">
            <RuiSkeletonLoader class="w-24 h-[42px]" />
            <RuiSkeletonLoader class="w-10 h-6" />
          </div>
          <RuiSkeletonLoader class="w-40 h-6" />
        </template>
        <template v-else>
          <div class="text-h6 text-rui-primary">
            {{ plan.displayedName }}
          </div>
          <template v-if="!isCustomPlan(plan)">
            <div class="flex flex-wrap items-end gap-x-1">
              <div class="text-h4 font-bold">
                {{ plan.mainPriceDisplay }}
              </div>
              <div
                v-if="!isFreePlan(plan)"
                class="text-lg font-medium"
              >
                {{ t('pricing.per_month') }}
              </div>
            </div>
            <div
              v-if="!isFreePlan(plan)"
              class="text-rui-text-secondary"
            >
              {{ plan.secondaryPriceDisplay }}
            </div>
          </template>
          <div
            v-else
            class="text-rui-text-secondary"
          >
            {{ t('pricing.custom_plan_info') }}
          </div>
        </template>
      </div>

      <PricingTableButton
        :plan="plan"
        :loading="plan.loading"
      />
    </div>

    <PricingTableCell
      v-for="(featureLabel, mainIndex) in featuresLabel"
      :key="mainIndex"
      :label="featureLabel || undefined"
      :value="plan.features[mainIndex]"
      :loading="plan.loading"
      :class="{
        'bg-gray-50': mainIndex % 2 === 0,
      }"
    />
  </div>
</template>
