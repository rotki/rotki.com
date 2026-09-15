<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import { get, set } from '@vueuse/shared';
import PricingTabContent from '~/components/pricings/PricingTabContent.vue';
import { isMostPopularPlan } from '~/components/pricings/utils';

const { plans, featuresLabel } = defineProps<{
  plans: MappedPlan[];
  featuresLabel: string[];
}>();

const { t } = useI18n({ useScope: 'global' });

function defaultTab(list: MappedPlan[]): string {
  return list.find(isMostPopularPlan)?.name ?? list[0]?.name ?? '';
}

const tab = ref<string>(defaultTab(plans));

watch(() => plans, (newPlans) => {
  const names = new Set(newPlans.map(p => p.name));
  if (!names.has(get(tab))) {
    set(tab, defaultTab(newPlans));
  }
});
</script>

<template>
  <div>
    <RuiTabs
      v-model="tab"
      class="w-full border-b border-default [&>div.no-scrollbar]:pt-9 [&>div.no-scrollbar]:!h-auto h-auto items-end"
      color="primary"
      grow
    >
      <RuiTab
        v-for="plan in plans"
        :key="plan.name"
        :value="plan.name"
        class="flex-1 relative !h-10 !px-3 min-w-24"
        :class="{ '!bg-blue-50 min-w-28': isMostPopularPlan(plan) }"
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
            {{ t('pricing.suggested_plan') }}
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
        <PricingTabContent
          :plan="plan"
          :features-label="featuresLabel"
        />
      </RuiTabItem>
    </RuiTabItems>
  </div>
</template>
