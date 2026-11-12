<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { useCheckoutMessages } from '../composables/checkout-messages';
import DiscountCodeField from './DiscountCodeField.vue';
import PlanLine from './PlanLine.vue';
import PriceRows from './PriceRows.vue';

const code = defineModel<string>('code', { required: true });

const {
  plan,
  breakdown,
  upgrade = false,
  oneTime = false,
  loading = false,
  disabled = false,
  campaign,
  renewsAt,
} = defineProps<{
  plan: Pick<SelectedPlan, 'name' | 'durationInMonths' | 'price'>;
  /** Payment breakdown from the API; until it loads the rows show the plan price. */
  breakdown?: PaymentBreakdownResponse;
  upgrade?: boolean;
  /** One-time payments (crypto) are paid once for the period. */
  oneTime?: boolean;
  /** A new breakdown is on its way. */
  loading?: boolean;
  /** Locks the discount field, e.g. while paying. */
  disabled?: boolean;
  /** A running campaign, offered next to the discount field. */
  campaign?: { code: string; percent: number };
  /** When the next payment is due; the next payment line leaves the date out without it. */
  renewsAt?: Date;
}>();

const emit = defineEmits<{
  /** The buyer applied a code, or removed one (empty string). */
  apply: [code: string];
}>();

defineSlots<{
  /** Next to the plan name, e.g. a button to change the plan. */
  'plan-action'?: () => any;
  /** Above the price rows, e.g. why reverse charge does not apply. */
  'notice'?: () => any;
}>();

const t = useCheckoutMessages();

// A subscription starts on payment, which is today.
const startsAt = new Date();
</script>

<template>
  <section
    aria-labelledby="order-summary-title"
    class="flex flex-col gap-4"
    data-testid="order-summary"
  >
    <!-- Below lg the payment page's summary bar already shows this title, so it stays for screen readers only. -->
    <h2
      id="order-summary-title"
      class="text-lg md:text-xl font-semibold text-rui-text max-lg:sr-only"
    >
      {{ t('checkout.page.summary') }}
    </h2>

    <PlanLine
      :plan="plan"
      :upgrade="upgrade"
      :one-time="oneTime"
      :starts-at="startsAt"
    >
      <template
        v-if="$slots['plan-action']"
        #action
      >
        <slot name="plan-action" />
      </template>
    </PlanLine>

    <hr class="border-rui-divider" />

    <DiscountCodeField
      v-model="code"
      :discount="breakdown?.discount ?? undefined"
      :campaign="campaign"
      :one-time="oneTime"
      :disabled="disabled"
      :loading="loading"
      @apply="emit('apply', $event)"
    />

    <slot name="notice" />

    <PriceRows
      :plan="plan"
      :breakdown="breakdown"
      :upgrade="upgrade"
      :loading="loading"
      :renews-at="renewsAt"
      :one-time="oneTime"
    />
  </section>
</template>
