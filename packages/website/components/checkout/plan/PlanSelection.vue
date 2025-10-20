<script lang="ts" setup>
import type { Plan } from '~/types';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { navigateToWithCSPSupport } from '~/utils/navigation';
import { canBuyNewSubscription } from '~/utils/subscription';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
const { plan: savedPlan } = usePlanParams();
const PRICE_INCREASE_LINK = 'https://blog.rotki.com/2025/10/13/rotki-tiers';

const { account, authenticated, plans } = storeToRefs(useMainStore());

const identifier = ref<number>(get(savedPlan));
const processing = ref<boolean>(false);

const selected = computed<Plan | undefined>(
  () => get(plans)?.find(plan => plan.months === get(identifier)),
);

const cryptoPrice = computed(() => {
  const plan = get(selected);
  if (!plan)
    return 0;

  return (parseFloat(plan.priceCrypto) / plan.months).toFixed(2);
});

const vat = computed(() => get(account)?.vat);

const isSelected = (plan: Plan) => plan === get(selected);

function select(plan: Plan) {
  set(identifier, plan.months);
}

async function next(): Promise<void> {
  set(processing, true);
  await navigateToWithCSPSupport({
    name: 'checkout-pay-method',
    query: { ...route.query, plan: get(identifier) },
  });
}

const canBuy = reactify(canBuyNewSubscription)(account);
</script>

<template>
  <div :class="$style.container">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_1.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      <span v-if="vat">{{ t('home.plans.tiers.step_1.vat', { vat }) }}</span>
      <span v-if="!authenticated">
        {{ t('home.plans.tiers.step_1.maybe_vat') }}
      </span>
    </CheckoutDescription>

    <div :class="$style.selection">
      <div :class="$style.selectable">
        <SelectablePlan
          v-for="plan in plans"
          :key="plan.months"
          :plan="plan"
          :popular="plan.months === 12"
          :selected="isSelected(plan)"
          @click="select(plan)"
        />
      </div>

      <div
        v-if="selected"
        :class="$style.hint"
      >
        {{ t('home.plans.tiers.step_1.crypto_hint', { cryptoPrice }) }}
      </div>
    </div>

    <div class="max-w-[27.5rem] mx-auto flex flex-col justify-between grow">
      <RuiAlert
        type="warning"
        class="whitespace-break-spaces"
      >
        <i18n-t
          keypath="home.plans.tiers.step_1.price_bump"
        >
          <template #link>
            <ButtonLink
              inline
              color="primary"
              :to="PRICE_INCREASE_LINK"
              external
              class="hover:underline"
            >
              {{ t('home.plans.tiers.step_1.this_blog_post') }}
            </ButtonLink>
          </template>
          <template #basicTier>
            <strong>
              {{ t('home.plans.tiers.step_1.basic_tier') }}
            </strong>
          </template>
          <template #newPrice>
            <strong>
              {{ t('home.plans.tiers.step_1.new_price') }}
            </strong>
          </template>
        </i18n-t>
      </RuiAlert>

      <SubscriptionNotes />

      <div :class="$style.continue">
        <RuiButton
          :disabled="!selected || !canBuy"
          :loading="processing"
          class="w-full"
          color="primary"
          size="lg"
          @click="next()"
        >
          {{ t('actions.continue') }}
        </RuiButton>
      </div>

      <div
        v-if="!canBuy"
        class="inline text-sm text-rui-text-secondary mt-2"
      >
        <span>* {{ t('home.plans.cannot_continue') }}</span>
        <ButtonLink
          to="/home/subscription"
          variant="text"
          color="primary"
          inline
          class="leading-[0] hover:underline"
        >
          {{ t('page_header.manage_premium') }}
        </ButtonLink>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.container {
  @apply flex flex-col w-full grow;
}

.selection {
  @apply flex flex-col w-full justify-center my-8;
}

.selectable {
  @apply w-full lg:w-auto grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 xl:gap-8;
}

.hint {
  @apply mt-3 text-base italic text-rui-text;
}

.continue {
  @apply mt-[2.63rem];
}
</style>
