<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import type { MappedPlan } from '~/components/pricings/type';
import type { PricingPeriod } from '~/types/tiers';
import { get } from '@vueuse/core';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';

const props = defineProps<{
  plan: MappedPlan;
  selectedPeriod: PricingPeriod;
}>();

const {
  public: {
    contact: { emailMailto },
  },
} = useRuntimeConfig();

const { referralCode } = useReferralCodeParam();

const { t } = useI18n({ useScope: 'global' });

const checkoutLink = computed<RouteLocationRaw>(() => {
  const query = buildQueryParams({
    planId: props.plan.id,
    ref: get(referralCode),
  });

  return {
    name: 'checkout-pay-method',
    query,
  };
});
</script>

<template>
  <ButtonLink
    v-if="isFreePlan(plan)"
    class="w-full py-2 xl:text-[1rem]"
    to="/download"
    color="primary"
    variant="outlined"
  >
    {{ t('actions.start_now_for_free') }}
  </ButtonLink>

  <ButtonLink
    v-else-if="isCustomPlan(plan)"
    class="w-full py-2 xl:text-[1rem]"
    color="primary"
    variant="default"
    :to="emailMailto"
  >
    {{ t('values.contact_section.title') }}
  </ButtonLink>

  <ButtonLink
    v-else
    class="w-full py-2 xl:text-[1rem]"
    variant="default"
    color="primary"
    :to="checkoutLink"
  >
    {{ t('actions.get_plan', { plan: toTitleCase(plan.name) }) }}
  </ButtonLink>
</template>
