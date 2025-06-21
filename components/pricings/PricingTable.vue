<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import type { PricingPeriod } from '~/types/tiers';
import PricingTableButton from '~/components/pricings/PricingTableButton.vue';
import PricingTableCell from '~/components/pricings/PricingTableCell.vue';
import { isCustomPlan, isMostPopularPlan, isStarterPlan } from '~/components/pricings/utils';

defineProps<{
  plans: MappedPlan[];
  selectedPeriod: PricingPeriod;
  compact?: boolean;
  featuresLabel: { title: string; children: string[] }[];
}>();

const { t } = useI18n();
</script>

<template>
  <div
    class="grid"
    :style="{
      gridTemplateColumns: `repeat(${plans.length + 1}, 1fr)`,
    }"
  >
    <div />
    <div
      v-for="plan in plans"
      :key="plan.name"
      class="flex flex-col"
    >
      <div
        v-if="isMostPopularPlan(plan)"
        class="rounded-t-xl bg-rui-primary text-white text-center font-medium text-sm py-3"
      >
        {{ t('pricing.most_popular_plan') }}
      </div>
      <div
        v-else
        class="h-11"
      />
      <div
        class="px-4 py-6 xl:px-6 xl:py-10 flex flex-col justify-between flex-1"
        :class="{ 'border-x-2 border-rui-primary': isMostPopularPlan(plan) }"
      >
        <div class="flex flex-col gap-4 mb-6">
          <div class="text-h6 text-rui-primary">
            {{ plan.displayedName }}
          </div>
          <template v-if="!isCustomPlan(plan)">
            <div class="flex flex-wrap items-end gap-x-1">
              <div class="text-h5 xl:text-h4 font-bold">
                {{ plan.mainPriceDisplay }}
              </div>
              <div
                v-if="!isStarterPlan(plan)"
                class="text-lg font-medium"
              >
                {{ t('pricing.per_month') }}
              </div>
            </div>
            <div
              v-if="!isStarterPlan(plan)"
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
    </div>

    <template
      v-for="(featureLabel, mainIndex) in featuresLabel"
      :key="mainIndex"
    >
      <div
        class="p-4 text-rui-primary font-medium"
        :class="{ 'pt-16': mainIndex > 0 }"
      >
        {{ featureLabel.title }}
      </div>
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="h-full"
        :class="{ 'border-x-2 border-rui-primary': isMostPopularPlan(plan) }"
      />
      <template
        v-for="(item, smallIndex) in featureLabel.children"
        :key="smallIndex"
      >
        <div
          :class="{ 'bg-gray-50': smallIndex % 2 === 0 }"
          class="px-4 py-3.5 font-medium"
        >
          {{ item }}
        </div>
        <template
          v-for="plan in plans"
          :key="plan.name"
        >
          <PricingTableCell
            :value="plan.features[mainIndex][smallIndex] "
            :class="{
              'bg-gray-50': smallIndex % 2 === 0,
              'border-x-2 border-rui-primary': isMostPopularPlan(plan),
            }"
          />
        </template>
      </template>
    </template>
    <template v-if="!compact">
      <div />
      <div
        v-for="plan in plans"
        :key="plan.name"
        class="flex flex-col p-4 xl:p-6"
        :class="{ 'border-x-2 border-rui-primary rounded-b-xl border-b-2': isMostPopularPlan(plan) }"
      >
        <PricingTableButton
          :selected-period="selectedPeriod"
          :plan="plan"
        />
      </div>
    </template>
  </div>
</template>
