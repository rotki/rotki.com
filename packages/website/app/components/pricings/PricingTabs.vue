<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import type { PricingPeriod } from '~/types/tiers';
import { get, set } from '@vueuse/shared';
import PricingTableButton from '~/components/pricings/PricingTableButton.vue';
import PricingTableCell from '~/components/pricings/PricingTableCell.vue';
import { isCustomPlan, isFreePlan, isMostPopularPlan } from '~/components/pricings/utils';

const { plans, featuresLabel } = defineProps<{
  plans: MappedPlan[];
  selectedPeriod: PricingPeriod;
  compact?: boolean;
  featuresLabel: string[];
}>();

const { t } = useI18n({ useScope: 'global' });

const tab = ref<string>(plans[0]?.name ?? '');

watch(() => plans, (newPlans) => {
  const names = new Set(newPlans.map(p => p.name));
  if (!names.has(get(tab))) {
    set(tab, newPlans[0]?.name ?? '');
  }
});
</script>

<template>
  <div>
    <RuiTabs
      v-model="tab"
      class="w-full border-b border-default [&>div.no-scrollbar]:pt-9 h-auto items-end"
      color="primary"
      grow
    >
      <RuiTab
        v-for="plan in plans"
        :key="plan.name"
        :value="plan.name"
        class="flex-1 relative !h-10 min-w-28"
        :class="{ '!bg-blue-50 min-w-36': isMostPopularPlan(plan) }"
      >
        <template v-if="plan.loading">
          <RuiSkeletonLoader class="w-16 h-4" />
        </template>
        <template v-else>
          {{ plan.displayedName }}
        </template>
        <div
          v-if="isMostPopularPlan(plan)"
          class="absolute left-0 w-full bottom-full rounded-t-lg bg-rui-primary text-white text-center font-medium text-sm py-1.5 flex-1 px-2"
        >
          <template v-if="plan.loading">
            <RuiSkeletonLoader class="w-20 h-5 mx-auto opacity-30" />
          </template>
          <template v-else>
            {{ t('pricing.most_popular_plan') }}
          </template>
        </div>
      </RuiTab>
    </RuiTabs>
    <RuiTabItems v-model="tab">
      <RuiTabItem
        v-for="plan in plans"
        :key="plan.name"
        :value="plan.name"
      >
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
              :selected-period="selectedPeriod"
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
      </RuiTabItem>
    </RuiTabItems>
  </div>
</template>
