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

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <PlanOverview>
    <div
      :class="$style.plan"
      class="text-rui-text"
    >
      {{ name }}
    </div>
    <i18n-t
      keypath="selected_plan_overview.plan"
      :plural="crypto ? 0 : 1"
      scope="global"
      tag="div"
      class="font-medium whitespace-break-spaces"
    >
      <template #period>
        {{
          t('selected_plan_overview.renew_period',
            {
              months: plan.months,
            },
            plan.months,
          )
        }}
      </template>
    </i18n-t>
    <i18n-t
      keypath="selected_plan_overview.price"
      scope="global"
      tag="div"
      class="mt-3"
    >
      <template #finalPriceInEur>
        <span class="font-bold">{{ plan.finalPriceInEur }}</span>
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
    <i18n-t
      v-if="!crypto"
      keypath="selected_plan_overview.starting"
      scope="global"
      tag="div"
    >
      <template #date>
        <span class="font-bold">{{ date }}</span>
      </template>
    </i18n-t>
    <div class="text-xs mt-1 italic whitespace-break-spaces">
      <template v-if="!crypto">
        {{
          t('selected_plan_overview.recurring_info', {
            period: plan.months === 12 ? t('selected_plan_overview.year') : t('selected_plan_overview.month'),
          })
        }}
      </template>
      <template v-else>
        {{ t('selected_plan_overview.one_time_payment') }}
      </template>
    </div>

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
