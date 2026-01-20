<script setup lang="ts">
import { get } from '@vueuse/shared';
import CheckoutDescription from '~/components/checkout/common/CheckoutDescription.vue';
import CheckoutNotifications from '~/components/checkout/common/CheckoutNotifications.vue';
import CheckoutTitle from '~/components/checkout/common/CheckoutTitle.vue';
import OrderSummaryCard from '~/components/checkout/common/OrderSummaryCard.vue';
import { useCheckout } from '~/composables/checkout/use-checkout';

withDefaults(
  defineProps<{
    hideSidebar?: boolean;
    hideHeader?: boolean;
  }>(),
  {
    hideSidebar: false,
    hideHeader: false,
  },
);

defineSlots<{
  default: () => void;
  description?: () => void;
}>();

const { t } = useI18n({ useScope: 'global' });
const { effectiveSelectedPlan } = useCheckout();

const hasPlan = computed<boolean>(() => !!get(effectiveSelectedPlan));
</script>

<template>
  <div class="flex flex-col w-full mx-auto grow max-w-7xl">
    <div
      v-if="!hideHeader"
      class="mb-6"
    >
      <CheckoutTitle>
        {{ t('home.plans.tiers.step_3.title') }}
      </CheckoutTitle>
      <slot name="description">
        <CheckoutDescription>
          {{ t('home.plans.tiers.step_3.subtitle') }}
        </CheckoutDescription>
      </slot>
    </div>

    <div
      v-if="!hideSidebar && hasPlan"
      class="flex flex-col gap-8 md:gap-10 xl:grid xl:grid-cols-[1.5fr_1fr] xl:gap-12 xl:items-start"
    >
      <div class="flex flex-col gap-6 min-w-0">
        <slot />
      </div>
      <aside class="w-full xl:sticky xl:top-8 xl:self-start">
        <OrderSummaryCard />
      </aside>
    </div>

    <div v-else>
      <slot />
    </div>
  </div>

  <CheckoutNotifications />
</template>
