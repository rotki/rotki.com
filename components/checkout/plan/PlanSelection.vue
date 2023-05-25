<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { type Plan } from '~/types';
import { useMainStore } from '~/store';

defineProps<{ plans: Plan[] }>();

const selected = ref<Plan | null>(null);
const isSelected = (plan: Plan) => plan === selected.value;

const cryptoPrice = computed(() => {
  const plan = selected.value;
  if (!plan) {
    return 0;
  }
  return (parseFloat(plan.priceCrypto) / plan.months).toFixed(2);
});

const next = () => {
  navigateTo({
    path: '/checkout/payment-method',
    query: {
      p: selected.value?.months.toString(),
    },
  });
};

const { account, authenticated } = storeToRefs(useMainStore());

const vat = computed(() => account.value?.vat);

const css = useCssModule();
</script>

<template>
  <div :class="css.container">
    <CheckoutTitle> Premium Plans </CheckoutTitle>
    <CheckoutDescription>
      <span v-if="vat">The prices include a +{{ vat }}% VAT tax</span>
      <span v-if="!authenticated">
        VAT may apply depending on your jurisdiction
      </span>
    </CheckoutDescription>

    <div :class="css.selection">
      <div :class="css.selectable">
        <SelectablePlan
          v-for="plan in plans"
          :key="plan.months"
          :plan="plan"
          :selected="isSelected(plan)"
          @click="selected = plan"
        />
      </div>
    </div>

    <div :class="css.hint">
      <span v-if="selected">
        * When paying with crypto the monthly price is
        {{ cryptoPrice }} €
      </span>
    </div>

    <div :class="css.continue">
      <SelectionButton :disabled="!selected" selected @click="next()">
        Continue
      </SelectionButton>
    </div>

    <div class="mt-8">
      <TextHeading secondary class="mb-4">Notes</TextHeading>
      <ul :class="css.notes">
        <li>
          The selected payment method will be billed the total amount for the
          subscription immediately.
        </li>
        <li>
          New billing cycle starts at UTC midnight after the subscription has
          ran out.
        </li>
        <li>
          An invoice is generated for each payment and you can access it from
          your account page.
        </li>
        <li>
          Subscriptions can be canceled from the account page at any point in
          time.
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" module>
.container {
  @apply w-full;
}

.selection {
  @apply flex flex-row w-full justify-center;
}

.selectable {
  @apply w-full lg:w-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8;
}

.hint {
  @apply mt-4 text-base italic h-5 text-typography;
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 180px;
  }
}

.notes {
  @apply list-disc pl-6;
}
</style>
