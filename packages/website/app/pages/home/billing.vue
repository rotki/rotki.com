<script lang="ts" setup>
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountCredit from '~/components/account/home/AccountCredit.vue';
import AccountSection from '~/components/account/home/AccountSection.vue';
import InvoiceDetails from '~/components/account/home/InvoiceDetails.vue';
import PaymentCardSkeleton from '~/components/account/home/payment-methods/PaymentCardSkeleton.vue';
import SavedCards from '~/components/account/home/payment-methods/SavedCards.vue';
import PaymentsTable from '~/components/account/home/PaymentsTable.vue';
import ReferralCode from '~/components/account/home/ReferralCode.vue';
import SubscriptionTable from '~/components/account/home/SubscriptionTable.vue';
import { useSubscriptionActions } from '~/composables/subscription/use-subscription-actions';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import { useMainStore } from '~/store';

usePageSeoNoIndex('Billing');

definePageMeta({
  auth: true,
  layout: 'account',
});

const { t } = useI18n({ useScope: 'global' });

const { account, cardPaymentChecked, hasCardPayment } = storeToRefs(useMainStore());
const { userSubscriptions } = useUserSubscriptions();

const emailConfirmed = computed<boolean>(() => get(account)?.emailConfirmed ?? false);
const pending = computed<UserSubscription[]>(() => get(userSubscriptions).filter(sub => sub.pending));

const { displayActions } = useSubscriptionActions();
const { availablePlans } = useAvailablePlans();
/** Fold the subscriptions only when none would show an action button: no cancel, renew, resume or pending payment. */
const subscriptionsFolded = computed<boolean>(() => !get(userSubscriptions).some(sub => displayActions(sub, get(availablePlans))));
</script>

<template>
  <div class="space-y-12">
    <SavedCards v-if="hasCardPayment" />
    <!-- Holds the card section's space until the store knows whether the account pays by card -->
    <div
      v-else-if="!cardPaymentChecked"
      aria-hidden="true"
    >
      <div class="mb-5 space-y-2">
        <RuiSkeletonLoader class="h-6 w-40" />
        <RuiSkeletonLoader class="h-4 w-64" />
      </div>
      <PaymentCardSkeleton />
    </div>

    <AccountSection
      v-if="emailConfirmed"
      :title="t('account.billing.referral.title')"
      :description="t('account.billing.referral.description')"
    >
      <div class="rounded-lg border border-default p-4 md:p-6 grid gap-6 lg:gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ReferralCode />
        <AccountCredit />
      </div>
    </AccountSection>

    <PaymentsTable :pending="pending" />
    <SubscriptionTable
      v-if="emailConfirmed"
      :folded="subscriptionsFolded"
    />
    <InvoiceDetails />
  </div>
</template>
