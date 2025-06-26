<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import type { PricingPeriod } from '~/types/tiers';
import PricingTableButton from '~/components/pricings/PricingTableButton.vue';
import PricingTableCell from '~/components/pricings/PricingTableCell.vue';
import { isCustomPlan, isFreePlan, isMostPopularPlan } from '~/components/pricings/utils';

const props = defineProps<{
  plans: MappedPlan[];
  selectedPeriod: PricingPeriod;
  compact?: boolean;
  featuresLabel: { title: string; children: string[] }[];
}>();

const { t } = useI18n({ useScope: 'global' });

const tab = ref(props.plans[0].name);
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
        {{ plan.displayedName }}
        <div
          v-if="isMostPopularPlan(plan)"
          class="absolute left-0 w-full bottom-full rounded-t-lg bg-rui-primary text-white text-center font-medium text-sm py-1.5 flex-1 px-2"
        >
          {{ t('pricing.most_popular_plan') }}
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
            </div>

            <PricingTableButton
              :selected-period="selectedPeriod"
              :plan="plan"
            />
          </div>

          <template
            v-for="(featureLabel, mainIndex) in featuresLabel"
            :key="mainIndex"
          >
            <div
              class="p-4 text-rui-primary font-medium"
              :class="{ 'pt-8': mainIndex > 0 }"
            >
              {{ featureLabel.title }}
            </div>
            <template
              v-for="(item, smallIndex) in featureLabel.children"
              :key="smallIndex"
            >
              <PricingTableCell
                :label="item"
                :value="plan.features[mainIndex][smallIndex] "
                :class="{
                  'bg-gray-50': smallIndex % 2 === 0,
                }"
              />
            </template>
          </template>
          <div
            v-if="!compact"
            class="pt-8 px-4"
          >
            <PricingTableButton
              :selected-period="selectedPeriod"
              :plan="plan"
            />
          </div>
        </div>
      </RuiTabItem>
    </RuiTabItems>
  </div>
</template>
