<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import { usePaymentCryptoStore } from '~/store/payments/crypto';

const { t } = useI18n();

const store = useMainStore();
const acceptRefundPolicy = ref(false);
const processing = ref<boolean>(false);

const { plan } = usePlanParams();
const { paymentMethodId } = usePaymentMethodParam();
const { subscriptionId } = useSubscriptionIdParam();

async function back() {
  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan: get(plan),
      method: get(paymentMethodId),
      id: get(subscriptionId),
    },
  });
}

const currency = ref('');

function submit() {
  set(processing, true);
  navigateTo({
    name: 'checkout-pay-crypto',
    query: {
      plan: get(plan),
      currency: get(currency),
      method: get(paymentMethodId),
      id: get(subscriptionId),
    },
  });
}

const cryptoStore = usePaymentCryptoStore();

onBeforeMount(async () => {
  await store.getPlans();
  await cryptoStore.fetchPaymentAssets();
});
const css = useCssModule();

const valid = computed(() => get(acceptRefundPolicy) && !!get(currency));
</script>

<template>
  <div :class="css.content">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_3.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_3.subtitle') }}
    </CheckoutDescription>
    <CryptoPaymentInfo />
    <RuiDivider class="my-8" />
    <CryptoAssetSelector v-model="currency" />
    <AcceptRefundPolicy
      v-model="acceptRefundPolicy"
      :class="css.policy"
      :disabled="processing"
    />
    <div :class="css.buttons">
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
