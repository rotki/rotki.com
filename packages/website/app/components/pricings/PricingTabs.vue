<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import { get, set } from '@vueuse/shared';
import PricingTabContent from '~/components/pricings/PricingTabContent.vue';
import { isMostPopularPlan } from '~/components/pricings/utils';
import { toTitleCase } from '~/utils/text';

const { plans, featuresLabel } = defineProps<{
  plans: MappedPlan[];
  featuresLabel: string[];
}>();

const { t } = useI18n({ useScope: 'global' });

function defaultTab(list: MappedPlan[]): string {
  return list.find(isMostPopularPlan)?.name ?? list[0]?.name ?? '';
}

const tab = ref<string>(defaultTab(plans));

/** Arrow keys move between plans, as in a native tab list. */
const KEY_OFFSETS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

function onKeydown(event: KeyboardEvent, index: number): void {
  const offset = KEY_OFFSETS[event.key];
  if (offset === undefined)
    return;
  event.preventDefault();
  const next = (index + offset + plans.length) % plans.length;
  const plan = plans[next];
  if (!plan)
    return;
  set(tab, plan.name);
  // Sibling lookup rather than a v-for template ref: Vue does not keep ref arrays in source order
  const sibling = (event.currentTarget as HTMLElement | null)?.parentElement?.children[next];
  if (sibling instanceof HTMLElement)
    sibling.focus();
}

watch(() => plans, (newPlans) => {
  const names = new Set(newPlans.map(p => p.name));
  if (!names.has(get(tab))) {
    set(tab, defaultTab(newPlans));
  }
});
</script>

<template>
  <div>
    <!--
      A fixed five-column control instead of RuiTabs: on a phone the ui-library tabs
      showed scroll arrows that kept the labels overflowing and clipped the badge.
    -->
    <div
      role="tablist"
      :aria-label="t('pricing.compare_plans')"
      class="grid border-b border-default pt-9"
      :style="{ gridTemplateColumns: `repeat(${plans.length}, minmax(0, 1fr))` }"
    >
      <button
        v-for="(plan, index) in plans"
        :id="`pricing-tab-${plan.name}`"
        :key="plan.name"
        type="button"
        role="tab"
        :aria-selected="tab === plan.name"
        :aria-controls="`pricing-panel-${plan.name}`"
        :tabindex="tab === plan.name ? 0 : -1"
        class="relative h-10 px-1 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="[
          tab === plan.name ? 'border-rui-primary text-rui-primary' : 'border-transparent text-rui-text-secondary hover:text-rui-text',
          { 'bg-rui-primary/[0.06]': isMostPopularPlan(plan) },
        ]"
        @click="tab = plan.name"
        @keydown="onKeydown($event, index)"
      >
        <RuiSkeletonLoader
          v-if="plan.loading"
          class="w-12 h-4 mx-auto"
        />
        <!-- Truncate the label, not the button: overflow on the button would clip the badge above it -->
        <span
          v-else
          class="block truncate"
        >
          {{ toTitleCase(plan.name) }}
        </span>
        <span
          v-if="isMostPopularPlan(plan)"
          class="absolute left-0 w-full bottom-full rounded-t-lg bg-rui-primary text-white text-center text-xs font-medium py-1.5 px-1 truncate"
        >
          <RuiSkeletonLoader
            v-if="plan.loading"
            class="w-14 h-4 mx-auto opacity-30"
          />
          <template v-else>
            {{ t('pricing.suggested_plan') }}
          </template>
        </span>
      </button>
    </div>
    <!-- v-show keeps every plan in the DOM, as the tab panels did before -->
    <div
      v-for="plan in plans"
      v-show="tab === plan.name"
      :id="`pricing-panel-${plan.name}`"
      :key="plan.name"
      role="tabpanel"
      :aria-labelledby="`pricing-tab-${plan.name}`"
    >
      <PricingTabContent
        :plan="plan"
        :features-label="featuresLabel"
      />
    </div>
  </div>
</template>
