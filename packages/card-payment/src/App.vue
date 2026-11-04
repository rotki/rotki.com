<script setup lang="ts">
import CheckoutShell from '@rotki/checkout-ui/components/CheckoutShell.vue';
import MethodTiles from '@rotki/checkout-ui/components/MethodTiles.vue';
import { get } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import CampaignRibbon from '@/components/CampaignRibbon.vue';
import CardPayment from '@/components/CardPayment.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import { useCardPageData } from '@/composables/card-page-data';
import { useCardPageHead } from '@/composables/page-head';
import { paths } from '@/config/paths';
import { checkoutMethodLinks, navigation, routes, withCheckoutParams } from '@/utils/navigation';
import logoSmall from '/img/logo-small.svg';

useCardPageHead();

const {
  account,
  campaign,
  cards,
  errorMessage,
  fail,
  initialDiscountCode,
  load,
  loading,
  loadingMessage,
  modelSelectedCard,
  planData,
  refreshCards,
  selectedPlan,
  upgradeSubId,
} = useCardPageData();

const campaignApplied = ref<boolean>(false);

const discount = computed<{ initialCode: string; campaign?: { code: string; percent: number } }>(() => {
  const active = get(campaign);
  return {
    initialCode: get(initialDiscountCode),
    // The field only shows while no code is applied, so a running campaign is offered, not claimed.
    campaign: active ? { code: active.code, percent: active.percent } : undefined,
  };
});

/*
 * An upgrade keeps the subscription's payment method and starts from the subscription page,
 * so its way back leads there and it gets no switch to another method. The link waits for
 * the load: the prerendered page has no query params, and hydration keeps the prerendered href.
 */
const backHref = computed<string | undefined>(() => {
  if (get(loading))
    return undefined;
  return get(upgradeSubId) ? routes.subscription : withCheckoutParams(routes.plans);
});

const methodLinks = checkoutMethodLinks();

onMounted(async () => {
  await load();
});
</script>

<template>
  <CheckoutShell
    step="payment"
    :logo-src="logoSmall"
    :home-href="routes.home"
    :back-href="backHref"
    :back-to="upgradeSubId ? 'subscription' : 'plans'"
    :site-url="paths.hostUrlBase"
  >
    <LoadingState
      v-if="loading"
      :message="loadingMessage"
    />

    <ErrorState
      v-else-if="errorMessage"
      :message="errorMessage"
      button-text="Go back"
      @button-click="navigation.goToPlans()"
    />

    <template v-else-if="planData && selectedPlan">
      <CampaignRibbon
        v-if="campaign"
        :campaign="campaign"
        :applied="campaignApplied"
      />

      <CardPayment
        v-model:selected-card="modelSelectedCard"
        v-model:campaign-applied="campaignApplied"
        :discount="discount"
        :cards="cards"
        :plan-data="planData"
        :selected-plan="selectedPlan"
        :upgrade-sub-id="upgradeSubId"
        :vat-id-status="account?.vatIdStatus"
        :country="account?.address.country"
        @handoff="navigation.goTo3DSecure(upgradeSubId)"
        @refresh-card="refreshCards()"
        @fatal-error="fail($event)"
      >
        <template
          v-if="!upgradeSubId"
          #methods
        >
          <MethodTiles
            :links="methodLinks"
            current="card"
          />
        </template>
      </CardPayment>
    </template>
  </CheckoutShell>
</template>
