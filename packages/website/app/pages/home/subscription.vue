<script lang="ts" setup>
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import AccountOverviewStats from '~/components/account/home/AccountOverviewStats.vue';
import AccountSection from '~/components/account/home/AccountSection.vue';
import ActiveSubscriptionCard from '~/components/account/home/ActiveSubscriptionCard.vue';
import ActiveSubscriptionCardSkeleton from '~/components/account/home/ActiveSubscriptionCardSkeleton.vue';
import PremiumPlaceholder from '~/components/account/home/PremiumPlaceholder.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAccountRefresh } from '~/composables/use-app-events';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import { useMainStore } from '~/store';

usePageSeoNoIndex('Overview');

definePageMeta({
  auth: true,
  layout: 'account',
});

const { t } = useI18n({ useScope: 'global' });

const { account } = storeToRefs(useMainStore());
const { userSubscriptions, activeOrPendingSubscription, refresh: refreshSubscriptions, initialLoading: initialSubscriptionsLoading } = useUserSubscriptions();
const { requestRefresh } = useAccountRefresh();

const premium = computed<boolean>(() => get(account)?.canUsePremium ?? false);
const isSubscriber = computed<boolean>(() => get(account)?.hasActiveSubscription ?? false);
const emailConfirmed = computed<boolean>(() => get(account)?.emailConfirmed ?? false);
const pending = computed<UserSubscription[]>(() => get(userSubscriptions).filter(sub => sub.pending));
const canUsePremium = computed<boolean>(() => get(premium) || get(pending).length > 0);

onBeforeMount(() => {
  requestRefresh();
});
</script>

<template>
  <div class="space-y-10">
    <AccountSection :title="t('account.subscriptions.current_plan')">
      <p
        v-if="!emailConfirmed"
        class="rounded-lg border border-dashed border-default p-5 md:p-6 text-body-2 text-rui-text-secondary"
      >
        {{ t('account.overview.confirm_first') }}
      </p>
      <PremiumPlaceholder v-else-if="!canUsePremium && !isSubscriber" />
      <ActiveSubscriptionCardSkeleton v-else-if="initialSubscriptionsLoading" />
      <ActiveSubscriptionCard
        v-else-if="activeOrPendingSubscription"
        :subscription="activeOrPendingSubscription"
        @refresh="refreshSubscriptions()"
      />
      <PremiumPlaceholder v-else />
    </AccountSection>

    <AccountOverviewStats />

    <div
      v-if="premium"
      class="rounded-lg border border-default p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <div class="flex-1 min-w-0">
        <h2 class="text-subtitle-1 font-medium text-rui-text">
          {{ t('account.overview.connect.title') }}
        </h2>
        <p class="mt-1 text-body-2 text-rui-text-secondary">
          {{ t('account.overview.connect.description') }}
        </p>
      </div>
      <ButtonLink
        to="/home/devices"
        color="primary"
        variant="outlined"
        class="self-start sm:self-auto"
      >
        {{ t('account.overview.connect.action') }}
      </ButtonLink>
    </div>
  </div>
</template>
