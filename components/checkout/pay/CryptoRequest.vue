<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { usePaymentCryptoStore } from '~/store/payments/crypto';

const { t } = useI18n({ useScope: 'global' });

const acceptRefundPolicy = ref(false);
const processing = ref<boolean>(false);

const { plan: planParams } = usePlanParams();
const { paymentMethodId } = usePaymentMethodParam();
const { subscriptionId } = useSubscriptionIdParam();

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

const currency = ref('');

function submit() {
  set(processing, true);
  navigateTo({
    name: 'checkout-pay-crypto',
    query: {
      ...get(planParams),
      currency: get(currency),
      method: get(paymentMethodId),
      id: get(subscriptionId),
    },
  });
}

const cryptoStore = usePaymentCryptoStore();

onBeforeMount(async () => {
  await cryptoStore.fetchPaymentAssets();
});

const valid = computed(() => get(acceptRefundPolicy) && !!get(currency));
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
    <RuiDivider class="my-8" />
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
