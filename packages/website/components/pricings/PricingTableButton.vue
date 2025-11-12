<script setup lang="ts">
import type { MappedPlan } from '~/components/pricings/type';
import type { PricingPeriod } from '~/types/tiers';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';

defineProps<{
  plan: MappedPlan;
  selectedPeriod: PricingPeriod;
}>();

const {
  public: {
    contact: { emailMailto },
  },
} = useRuntimeConfig();

const { t } = useI18n({ useScope: 'global' });
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
    :to="{
      name: 'checkout-pay-method',
      query: {
        planId: plan.id,
      },
    }"
  >
    {{ t('actions.get_plan', { plan: toTitleCase(plan.name) }) }}
  </ButtonLink>
</template>
