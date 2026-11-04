<script lang="ts" setup>
import { get } from '@vueuse/shared';
import CampaignRibbon from '~/components/common/CampaignRibbon.vue';
import { useAppConfig } from '~/composables/use-app-config';
import { useRedirectUrl } from '~/composables/use-redirect-url';
import { useCheckoutDiscount } from '~/modules/checkout/composables/use-checkout';

const route = useRoute();

/*
 * The plan step doubles as the public /pricing page and keeps the site layout. The later
 * steps use the checkout layout, which brings the shell with the stepper.
 */
const isFirstStep = computed<boolean>(() => route.name === 'checkout-pay');

const { activeCampaign } = useAppConfig();
const { validDiscountCode } = useCheckoutDiscount();

const campaignApplied = computed<boolean>(() => {
  const campaign = get(activeCampaign);
  return !!campaign && get(validDiscountCode) === campaign.code;
});

const { removeStoredRedirectUrl } = useRedirectUrl();

onBeforeMount(() => {
  removeStoredRedirectUrl();
});
</script>

<template>
  <div class="flex flex-col h-full grow">
    <CampaignRibbon :applied="campaignApplied" />
    <div
      class="flex grow min-w-0"
      :class="{ 'container py-4 lg:py-8 overflow-x-auto': isFirstStep }"
    >
      <form
        class="flex flex-col justify-between w-full"
        @submit.prevent
      >
        <NuxtPage />
      </form>
    </div>
  </div>
</template>
