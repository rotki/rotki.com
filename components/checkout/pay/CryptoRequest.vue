<script lang="ts" setup>
import type { DiscountInfo } from '~/types/payment';
import { get, set } from '@vueuse/core';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';
import { useSelectedPlan } from '~/composables/use-selected-plan';
import { usePaymentCryptoStore } from '~/store/payments/crypto';

const { t } = useI18n({ useScope: 'global' });

const acceptRefundPolicy = ref(false);
const processing = ref<boolean>(false);

const currency = ref('');

const discountCode = ref('');
const discountInfo = ref<DiscountInfo>();

const { planParams } = usePlanParams();
const { paymentMethodId } = usePaymentMethodParam();
const { subscriptionId } = useSubscriptionIdParam();

const { selectedPlan } = useSelectedPlan();
const cryptoStore = usePaymentCryptoStore();

async function back() {
  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      ...get(planParams),
      method: get(paymentMethodId),
      id: get(subscriptionId),
    },
  });
}

function submit() {
  set(processing, true);
  navigateTo({
    name: 'checkout-pay-crypto',
    query: {
      ...get(planParams),
      currency: get(currency),
      method: get(paymentMethodId),
      id: get(subscriptionId),
      discountCode: get(discountCode),
    },
  });
}

onBeforeMount(async () => {
  await cryptoStore.fetchPaymentAssets();
});

const valid = computed(() => get(acceptRefundPolicy) && !!get(currency));

const grandTotal = computed<number>(() => {
  const plan = get(selectedPlan);

  if (!plan)
    return 0;

  const discountVal = get(discountInfo);

  if (!discountVal || !discountVal.isValid) {
    return plan.price;
  }

  return discountVal.finalPrice;
});
</script>

<template>
  <div :class="$style.content">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_3.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_3.subtitle') }}
    </CheckoutDescription>
    <CryptoPaymentInfo />
    <template v-if="selectedPlan">
      <RuiDivider class="mt-8 mb-4" />
      <SelectedPlanOverview
        :plan="selectedPlan"
        :next-payment="0"
      />

      <DiscountCodeInput
        v-model="discountCode"
        v-model:discount-info="discountInfo"
        :plan="selectedPlan"
        class="mt-6"
      />

      <PaymentGrandTotal
        :grand-total="grandTotal"
        class="mt-6"
      />
    </template>
    <CryptoAssetSelector v-model="currency" />
    <AcceptRefundPolicy
      v-model="acceptRefundPolicy"
      :class="$style.policy"
      :disabled="processing"
    />
    <div :class="$style.buttons">
      <RuiButton
        v-if="!subscriptionId"
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="back()"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!valid"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex flex-col w-full max-w-[27.5rem] mx-auto grow;
}

.policy {
  @apply my-8;
}

.buttons {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>
