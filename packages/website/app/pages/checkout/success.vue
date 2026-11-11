<script lang="ts" setup>
import type { PaymentReceipt } from '~/modules/checkout/utils/payment-receipt';
import { formatEur } from '@rotki/card-payment-common/utils/money';
import { formatPlanName } from '@rotki/card-payment-common/utils/plan';
import CheckoutPanel from '@rotki/checkout-ui/components/CheckoutPanel.vue';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { useReferralTracking } from '~/composables/chronicling/use-referral-tracking';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import SubscriptionReceipt from '~/modules/checkout/components/success/SubscriptionReceipt.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';

definePageMeta({
  layout: 'checkout',
  middleware: ['payment-success'],
});

usePageSeoNoIndex('payment success');

const { t } = useI18n({ useScope: 'global' });

/** Set by the `payment-success` middleware from the payment just made. */
const receipt = useState<PaymentReceipt | undefined>('payment-receipt');

useAutoLogout();

// Clear checkout state after successful payment
const { reset } = useCheckout();
reset();

/*
 * Consume the referral attribution: a purchase reaching this page was sent to the
 * backend with the persisted ref, so clear the cookie to avoid re-applying it to
 * the user's future purchases.
 */
useReferralTracking().clearReferralCode();

const SETUP_GUIDE = 'https://docs.rotki.com/usage-guides/#set-up-rotki-premium';

/** A crypto payment is confirmed on chain later, so it is still pending here. */
const crypto = computed<boolean>(() => get(receipt)?.method === 'crypto');

/** An upgrade or a renewal: this account has its credentials and Premium set up already. */
const existingSubscriber = computed<boolean>(() => {
  const paid = get(receipt);
  return !!paid && (paid.upgrade || !!paid.renewal);
});

const title = computed<string>(() => {
  if (get(crypto))
    return t('subscription.crypto_success.title');
  const name = get(receipt)?.planName;
  if (!name)
    return t('subscription.success.title_generic');
  return t('subscription.success.title', { plan: formatPlanName(name) });
});

const message = computed<string>(() => {
  if (get(crypto))
    return get(existingSubscriber) ? t('subscription.crypto_success.message_existing') : t('subscription.crypto_success.message');
  const paid = get(receipt)?.paid;
  return paid ? t('subscription.success.paid', { amount: formatEur(paid) }) : '';
});
</script>

<template>
  <div
    class="flex flex-col gap-6 md:gap-8"
    data-testid="payment-success"
  >
    <header class="flex flex-col gap-4">
      <span
        class="size-12 rounded-full flex items-center justify-center"
        :class="crypto ? 'bg-rui-warning-soft' : 'bg-rui-success-soft'"
      >
        <RuiIcon
          :name="crypto ? 'lu-clock' : 'lu-check'"
          size="26"
          :color="crypto ? 'warning' : 'success'"
        />
      </span>
      <div class="flex flex-col gap-2">
        <h1 class="text-2xl md:text-3xl font-semibold text-rui-text">
          {{ title }}
        </h1>
        <p
          v-if="message"
          class="text-rui-text"
          data-testid="payment-success-message"
        >
          {{ message }}
        </p>
      </div>
    </header>

    <div
      class="grid grid-cols-1 gap-6"
      :class="existingSubscriber ? 'lg:grid-cols-[25rem]' : 'lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-12'"
    >
      <CheckoutPanel
        v-if="!existingSubscriber"
        data-testid="payment-success-next"
      >
        <h2 class="text-lg md:text-xl font-semibold text-rui-text">
          {{ t('subscription.success.next.title') }}
        </h2>
        <ol class="list-decimal pl-5 flex flex-col gap-2 text-rui-text">
          <li>{{ t('subscription.success.next.credentials') }}</li>
          <li>{{ t('subscription.success.next.app') }}</li>
        </ol>
        <p
          v-if="crypto"
          class="text-sm text-rui-text-secondary"
        >
          {{ t('subscription.success.next.crypto_note') }}
        </p>
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 mt-auto">
          <ButtonLink
            to="/home/devices"
            variant="default"
            color="primary"
            size="lg"
            class="w-full sm:w-auto"
          >
            {{ t('subscription.success.next.create') }}
          </ButtonLink>
          <NuxtLink
            :to="SETUP_GUIDE"
            external
            target="_blank"
            class="self-center sm:self-auto p-3 sm:p-0 text-rui-primary underline"
          >
            {{ t('subscription.success.next.guide') }}
          </NuxtLink>
        </div>
      </CheckoutPanel>

      <CheckoutPanel
        as="aside"
      >
        <SubscriptionReceipt
          v-if="receipt"
          :receipt="receipt"
        />
        <ButtonLink
          to="/home/subscription"
          variant="outlined"
          color="primary"
          class="w-full lg:w-auto lg:self-start mt-auto"
        >
          {{ t('subscription.success.account') }}
        </ButtonLink>
      </CheckoutPanel>
    </div>
  </div>
</template>
