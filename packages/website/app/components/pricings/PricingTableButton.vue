<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import type { MappedPlan } from '~/components/pricings/type';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { isCustomPlan, isEntryTierPlan, isFreePlan } from '~/components/pricings/utils';
import { useAppConfig } from '~/composables/use-app-config';
import { useDiscountCodeParams, useReferralCodeParam } from '~/modules/checkout/composables/use-plan-params';
import { buildQueryParams } from '~/utils/query';
import { toTitleCase } from '~/utils/text';

const { plan, loading = false } = defineProps<{
  plan: MappedPlan;
  loading?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const {
  public: {
    contact: { emailMailto },
  },
} = useRuntimeConfig();

const { referralCode } = useReferralCodeParam();
const { discountCode } = useDiscountCodeParams();
const { activeCampaign } = useAppConfig();

const checkoutLink = computed<RouteLocationRaw>(() => {
  // An explicit code in the URL wins over the sitewide campaign code.
  const query = buildQueryParams({
    discountCode: get(discountCode) ?? get(activeCampaign)?.code,
    planId: plan.id,
    ref: get(referralCode),
  });

  return {
    name: 'checkout-pay-method',
    query,
  };
});
</script>

<template>
  <RuiSkeletonLoader
    v-if="loading"
    class="w-full h-10"
    rounded="md"
  />

  <ButtonLink
    v-else-if="isFreePlan(plan)"
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
    :variant="isEntryTierPlan(plan) ? 'outlined' : 'default'"
    color="primary"
    :to="checkoutLink"
  >
    {{ t('actions.get_plan', { plan: toTitleCase(plan.name) }) }}
  </ButtonLink>
</template>
