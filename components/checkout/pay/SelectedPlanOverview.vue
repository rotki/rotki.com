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
  }
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

const select = () => {
  set(selection, true);
};

const switchTo = (months: number) => {
  set(selection, false);
  const currentRoute = router.currentRoute;

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
    <i18n-t keypath="selected_plan_overview.plan" scope="global">
      <template #date>
        {{ date }}
      </template>
      <template #finalPriceInEur>
        {{ plan.finalPriceInEur }}
      </template>
      <template #vat>
        <span v-if="plan.vat && !crypto">
          {{
            t('selected_plan_overview.vat', {
              vat: plan.vat,
              priceInEur: plan.priceInEur,
            })
          }}
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
        t('selected_plan_overview.renew_period', plan.months, {
          months: plan.months,
        })
      }}
    </span>

    <template #body>
      <div :class="css.change" @click="select">Change</div>
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
