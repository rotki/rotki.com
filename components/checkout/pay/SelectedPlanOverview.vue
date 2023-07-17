<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { type CryptoPayment, type SelectedPlan } from '~/types';
import { getPlanName } from '~/utils/plans';

const props = withDefaults(
  defineProps<{
    plan: SelectedPlan | CryptoPayment;
    crypto?: boolean;
    warning?: boolean;
  }>(),
  {
    crypto: false,
    warning: false,
  },
);

const { plan } = toRefs(props);
const router = useRouter();

const selection = ref(false);

const name = computed(() => getPlanName(get(plan).months));
const date = computed(() => {
  const currentPlan = get(plan);
  const date = new Date(currentPlan.startDate * 1000);
  return date.toLocaleDateString();
});

const vatOverview = computed(() => {
  const cPlan = get(plan);
  if (!(cPlan.vat && 'priceInEur' in cPlan)) {
    return undefined;
  }
  return {
    vat: cPlan.vat,
    priceInEur: cPlan.priceInEur,
  };
});

const select = () => {
  set(selection, true);
};

const switchTo = (months: number) => {
  set(selection, false);
  const currentRoute = get(router.currentRoute);

  navigateTo({
    path: currentRoute.path,
    query: {
      ...currentRoute.query,
      p: months.toString(),
    },
  });
};

const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <PlanOverview>
    <span :class="css.plan">{{ name }} Plan.</span>
    <I18nT keypath="selected_plan_overview.plan" scope="global">
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
    </I18nT>
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

    <template #body>
      <div :class="css.change" @click="select()">Change</div>
      <ChangePlanDialog
        :crypto="crypto"
        :warning="warning"
        :visible="selection"
        @cancel="selection = false"
        @select="switchTo($event)"
      />
    </template>
  </PlanOverview>
</template>

<style lang="scss" module>
.plan {
  @apply font-bold;
}

.change {
  @apply font-bold text-base cursor-pointer p-4;

  color: #351404;
}
</style>
