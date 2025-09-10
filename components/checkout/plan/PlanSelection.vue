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

const notes = computed(() => [
  t('home.plans.tiers.step_1.notes.line_1'),
  t('home.plans.tiers.step_1.notes.line_2'),
  t('home.plans.tiers.step_1.notes.line_3'),
  t('home.plans.tiers.step_1.notes.line_4'),
]);

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
      <div :class="$style.notes">
        <div
          v-for="(line, i) in notes"
          :key="i"
          :class="$style.note"
        >
          <RuiIcon
            :class="$style.note__icon"
            name="lu-circle-arrow-right"
          />
          <p>{{ line }}</p>
        </div>
      </div>

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
  @apply w-full lg:w-auto grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-4;
}

.hint {
  @apply mt-3 text-base italic text-rui-text;
}

.continue {
  @apply mt-[2.63rem];
}

.notes {
  @apply flex flex-col gap-3;

  .note {
    @apply flex gap-3;

    &__icon {
      @apply text-black/[.54] shrink-0;
    }
  }
}
</style>
