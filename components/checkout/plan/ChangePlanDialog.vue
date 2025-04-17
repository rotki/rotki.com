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
    crypto?: boolean;
    warning?: boolean;
  }>(),
  {
    crypto: false,
    warning: false,
  },
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'select', data: PlanParams & { planId: number }): void;
}>();

const { crypto, visible, warning } = toRefs(props);

const { t } = useI18n();
const { plan: planParams } = usePlanParams();

const confirmed = ref(false);

const selectedPlanPeriod = ref<PricingPeriod>(get(planParams)?.period || PricingPeriod.MONTHLY);

const store = useTiersStore();
const { availablePlans } = storeToRefs(store);

function select(plan: AvailablePlan) {
  if (get(warning) && !get(confirmed))
    return;

  return emit('select', {
    period: get(selectedPlanPeriod),
    planId: plan.subscriptionTierId,
    plan: plan.name,
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
  >
    <RuiCard>
      <template #header>
        {{ t('change_plan.title') }}
      </template>
      <div class="pt-4">
        <PricingPeriodTab
          v-model="selectedPlanPeriod"
          :data="availablePlans"
        />
      </div>
      <div class="flex flex-col gap-4 py-4">
        <SelectablePlan
          v-for="plan in availablePlans"
          :key="plan.subscriptionTierId"
          :plan="plan"
          readonly
          :disabled="warning && !confirmed"
          :period="selectedPlanPeriod"
          @click="select(plan)"
        />
      </div>
      <div
        v-if="crypto && warning"
        :class="$style.warning"
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
    </RuiCard>
  </RuiDialog>
</template>

<style module lang="scss">
.plan {
  @apply focus:outline-none px-4 py-2 my-2 transition bg-white;
  @apply border-black/[0.12] border border-solid rounded;

  &:not(.disabled):hover {
    @apply bg-rui-primary/[0.09] cursor-pointer;
  }

  &:not(.disabled):active {
    @apply bg-rui-primary/[0.15] border-rui-primary;
  }

  &.disabled {
    @apply bg-gray-50 cursor-not-allowed opacity-60;
  }
}

.name {
  @apply font-bold;
}

.warning {
  @apply mt-4 text-justify;
}
</style>
