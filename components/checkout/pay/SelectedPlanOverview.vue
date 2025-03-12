<script setup lang="ts">
import type { CryptoPayment, SelectedPlan } from '~/types';
import { get, set } from '@vueuse/core';
import { getPlanNameFor } from '~/utils/plans';

const props = withDefaults(
  defineProps<{
    plan: SelectedPlan | CryptoPayment;
    crypto?: boolean;
    warning?: boolean;
    disabled?: boolean;
  }>(),
  {
    crypto: false,
    warning: false,
  },
);

const { plan } = toRefs(props);
const router = useRouter();

const selection = ref(false);

const name = computed(() => getPlanNameFor(get(plan).months));
const date = computed(() => {
  const currentPlan = get(plan);
  const date = new Date(currentPlan.startDate * 1000);
  return date.toLocaleDateString();
});

const vatOverview = computed(() => {
  const cPlan = get(plan);
  if (!(cPlan.vat && 'priceInEur' in cPlan))
    return undefined;

  return {
    vat: cPlan.vat,
    priceInEur: cPlan.priceInEur,
  };
});

function select() {
  set(selection, true);
}

function switchTo(months: number) {
  set(selection, false);
  const currentRoute = get(router.currentRoute);

  navigateTo({
    path: currentRoute.path,
    query: {
      ...currentRoute.query,
      plan: months.toString(),
    },
  });
}

const { t } = useI18n();
</script>

<template>
  <PlanOverview>
    <span :class="$style.plan">{{ name }}</span>
    <i18n-t
      keypath="selected_plan_overview.plan"
      scope="global"
    >
      <template #date>
        {{ date }}
      </template>
      <template #finalPriceInEur>
        {{ plan.finalPriceInEur }}
      </template>
      <template #vat>
        <span v-if="vatOverview && !crypto">
          {{ t('selected_plan_overview.vat', vatOverview) }}
        </span>
        <span v-else-if="plan.vat">
          {{
            t('selected_plan_overview.includes_vat', {
              vat: plan.vat,
            })
          }}
        </span>
      </template>
    </i18n-t>
    <span>
      {{
        t(
          'selected_plan_overview.renew_period',
          {
            months: plan.months,
          },
          plan.months,
        )
      }}
    </span>

    <template #action>
      <RuiButton
        :class="$style.change"
        :disabled="disabled"
        color="primary"
        variant="text"
        @click="select()"
      >
        {{ t('actions.change') }}
      </RuiButton>
      <ChangePlanDialog
        :crypto="crypto"
        :warning="warning"
        :vat="vatOverview?.vat ?? plan.vat"
        :visible="selection"
        @cancel="selection = false"
        @select="switchTo($event)"
      />
    </template>
  </PlanOverview>
</template>

<style lang="scss" module>
.plan {
  @apply text-body-1 font-bold mr-1;
}
</style>
