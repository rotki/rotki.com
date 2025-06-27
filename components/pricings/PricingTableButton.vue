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
    class="w-full"
    to="/download"
    size="lg"
    color="primary"
    variant="outlined"
  >
    {{ t('actions.start_now_for_free') }}
  </ButtonLink>

  <ButtonLink
    v-else-if="isCustomPlan(plan)"
    class="w-full"
    size="lg"
    color="primary"
    variant="default"
    :to="emailMailto"
  >
    {{ t('values.contact_section.title') }}
  </ButtonLink>

  <ButtonLink
    v-else
    class="w-full"
    variant="default"
    size="lg"
    color="primary"
    :to="{
      name: 'checkout-pay',
      query: {
        plan: plan.name,
        period: selectedPeriod,
      },
    }"
  >
    {{ t('actions.get_started') }}
  </ButtonLink>
</template>
