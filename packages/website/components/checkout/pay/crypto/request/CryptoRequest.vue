<script lang="ts" setup>
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import { get, set } from '@vueuse/core';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const acceptRefundPolicy = ref<boolean>(false);
const processing = ref<boolean>(false);

const currency = ref<string>('');

const discountCode = ref<string>('');
const discountInfo = ref<DiscountInfo>();

const { planId } = usePlanIdParam();
const { subscriptionId, upgradeSubId } = useSubscriptionIdParam();
const { selectedPlan } = useSelectedPlan();

const valid = computed<boolean>(() => get(acceptRefundPolicy) && !!get(currency));

async function back(): Promise<void> {
  if (isDefined(upgradeSubId)) {
    await navigateTo({ name: 'home-subscription' });
    return;
  }

  const query = buildQueryParams({
    planId: get(planId),
    id: get(subscriptionId),
  });

  await navigateTo({
    name: 'checkout-pay-method',
    query,
  });
}

function submit(): void {
  set(processing, true);

  const query = buildQueryParams({
    planId: get(planId),
    currency: get(currency),
    id: get(subscriptionId),
    discountCode: get(discountCode),
    upgradeSubId: get(upgradeSubId),
  });

  navigateToWithCSPSupport({
    name: 'checkout-pay-crypto',
    query,
  });
}
</script>

<template>
  <div class="w-full max-w-7xl mx-auto md:px-4">
    <div class="mb-8">
      <CheckoutTitle>
        {{ t('home.plans.tiers.step_3.title') }}
      </CheckoutTitle>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </div>

    <div class="flex flex-col gap-8 md:gap-10 xl:grid xl:grid-cols-[1.5fr_1fr] xl:gap-12 xl:items-start">
      <div class="flex flex-col gap-6 min-w-0">
        <CryptoPaymentInfo class="mb-2" />

        <RuiCard>
          <div class="text-lg font-medium mb-6">
            {{ t('home.plans.tiers.step_3.select_payment') }}
          </div>
          <CryptoAssetSelector v-model="currency" />
        </RuiCard>
      </div>

      <aside
        v-if="selectedPlan"
        class="w-full xl:sticky xl:top-8 xl:self-start"
      >
        <OrderSummaryCard
          v-model:discount-code="discountCode"
          v-model:discount-info="discountInfo"
          :plan="selectedPlan"
          :upgrade-sub-id="upgradeSubId"
          crypto
        />
      </aside>
    </div>

    <AcceptRefundPolicy
      v-model="acceptRefundPolicy"
      class="mt-6 max-w-[27.5rem] mx-auto w-full"
      :disabled="processing"
    />

    <div class="flex gap-4 justify-center w-full mt-6 mx-auto max-w-[27.5rem]">
      <RuiButton
        v-if="!subscriptionId"
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="back()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
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
