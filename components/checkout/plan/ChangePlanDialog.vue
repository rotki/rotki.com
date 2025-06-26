<script setup lang="ts">
import type { PlanParams } from '~/composables/plan';
import type { AvailablePlan } from '~/types';
import { get, set, toRefs } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    warning?: boolean;
  }>(),
  {
    warning: false,
  },
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'select', data: PlanParams & { planId: number }): void;
}>();

const { visible, warning } = toRefs(props);

const { t } = useI18n();
const { planParams } = usePlanParams();

const confirmed = ref(false);

const selectedPlanPeriod = ref<PricingPeriod>(get(planParams)?.period || PricingPeriod.MONTHLY);

const store = useTiersStore();
const { availablePlans } = storeToRefs(store);

function select(plan: AvailablePlan) {
  if (get(warning) && !get(confirmed))
    return;

  const planId = plan[get(selectedPlanPeriod) === PricingPeriod.MONTHLY ? 'monthlyPlan' : 'yearlyPlan']?.planId;

  return emit('select', {
    period: get(selectedPlanPeriod),
    planId,
    plan: plan.tierName,
  });
}

watch(visible, (visible) => {
  if (!visible)
    set(confirmed, false);
});

onBeforeMount(async () => {
  await store.getAvailablePlans();
});
</script>

<template>
  <RuiDialog
    max-width="500"
    :model-value="visible"
    @closed="emit('cancel')"
  >
    <RuiCard content-class="!pt-0">
      <template #header>
        {{ t('change_plan.title') }}
      </template>
      <div
        v-if="warning"
        class="text-justify -mb-4"
      >
        <span class="text-rui-text-secondary">
          {{ t('change_plan.switch_warning') }}
        </span>
        <RuiCheckbox
          v-model="confirmed"
          class="mt-3"
          color="primary"
        >
          <i18n-t
            keypath="change_plan.switch_agree"
            scope="global"
          >
            <template #separator>
              <br />
            </template>
          </i18n-t>
        </RuiCheckbox>
      </div>
      <div class="relative pt-8">
        <PricingPeriodTab
          v-model="selectedPlanPeriod"
          :data="availablePlans"
        />
        <div class="flex flex-col gap-4 py-4">
          <SelectablePlan
            v-for="plan in availablePlans"
            :key="plan.tierName"
            class="hover:bg-rui-grey-100 transition-all"
            :plan="plan"
            readonly
            :disabled="warning && !confirmed"
            :period="selectedPlanPeriod"
            @click="select(plan)"
          />
        </div>
        <div class="flex justify-end gap-4 pt-4">
          <RuiButton
            variant="outlined"
            size="lg"
            class="w-full"
            color="primary"
            @click="emit('cancel')"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
        </div>
        <div
          v-if="warning && !confirmed"
          class="absolute w-full h-full top-0 left-0 bg-white/[0.7]"
        />
      </div>
    </RuiCard>
  </RuiDialog>
</template>
