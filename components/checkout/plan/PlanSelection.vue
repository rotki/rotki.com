<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import type { Plan } from '~/types';

const { t } = useI18n();
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

const isSelected = (plan: Plan) => plan === get(selected);

function select(plan: Plan) {
  set(identifier, plan.months);
}

function next() {
  set(processing, true);
  navigateTo({
    name: 'checkout-pay-method',
    query: { ...route.query, plan: get(identifier) },
  });
}

const css = useCssModule();
</script>

<template>
  <div :class="css.container">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_1.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      <span v-if="vat">{{ t('home.plans.tiers.step_1.vat', { vat }) }}</span>
      <span v-if="!authenticated">
        {{ t('home.plans.tiers.step_1.maybe_vat') }}
      </span>
    </CheckoutDescription>

    <div :class="css.selection">
      <div :class="css.selectable">
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
        :class="css.hint"
      >
        {{ t('home.plans.tiers.step_1.crypto_hint', { cryptoPrice }) }}
      </div>
    </div>

    <div class="max-w-[27.5rem] mx-auto flex flex-col justify-between grow">
      <div :class="css.notes">
        <div
          v-for="i in 4"
          :key="i"
          :class="css.note"
        >
          <RuiIcon
            :class="css.note__icon"
            name="arrow-right-circle-line"
          />
          <p>{{ t(`home.plans.tiers.step_1.notes.${i}`) }}</p>
        </div>
      </div>

      <div :class="css.continue">
        <RuiButton
          :disabled="!selected"
          :loading="processing"
          class="w-full"
          color="primary"
          size="lg"
          @click="next()"
        >
          {{ t('actions.continue') }}
        </RuiButton>
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
