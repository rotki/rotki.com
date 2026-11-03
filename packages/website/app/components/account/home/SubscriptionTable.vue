<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { DataTableColumn, DataTableSortColumn } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import AccountSection from '~/components/account/home/AccountSection.vue';
import RefreshButton from '~/components/account/home/RefreshButton.vue';
import { getSubscriptionTableHeaders } from '~/components/account/home/subscription-table/config';
import SubscriptionActionsCell from '~/components/account/home/subscription-table/SubscriptionActionsCell.vue';
import SubscriptionStatusChip from '~/components/account/home/subscription-table/SubscriptionStatusChip.vue';
import SubscriptionDialogs from '~/components/account/home/SubscriptionDialogs.vue';
import { useSubscriptionActionFlow } from '~/composables/subscription/use-subscription-action-flow';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { useSubscriptionPolling } from '~/composables/subscription/use-subscription-polling';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { useAccountTable } from '~/composables/use-account-table';
import { formatDate, isValidDate } from '~/utils/date';
import { orderColumns } from '~/utils/table';

const { folded = false } = defineProps<{
  /** Starts folded behind a Show button, for when no subscription has anything left to do. */
  folded?: boolean;
}>();

const { n, t } = useI18n({ useScope: 'global' });
const { isMdAndDown } = useBreakpoint();
const sort = ref<DataTableSortColumn<UserSubscription>>({
  column: 'createdDate',
  direction: 'desc',
});

const { availablePlans } = useAvailablePlans();

// Composables
const { userSubscriptions, loading, initialLoading, refresh: refreshSubscriptions } = useUserSubscriptions();
const { getPlanDisplayName, actionsClasses } = useSubscriptionDisplay();

// Computed properties
const pending = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(sub => sub.pending),
);

const renewableSubscriptions = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(({ actions }) => actions.includes('renew')),
);

/** Phones see two columns at once, so what can be done comes right after the plan. */
const headers = computed<DataTableColumn<UserSubscription>[]>(() => {
  const columns = getSubscriptionTableHeaders(t);
  return get(isMdAndDown) ? orderColumns(columns, ['planName', 'actions', 'status']) : columns;
});

const { modelPagination, tableProps } = useAccountTable(userSubscriptions);

const expanded = ref<boolean>(false);
const showTable = computed<boolean>(() => !folded || get(expanded));

const {
  activeAction,
  cancelSubscription,
  cancelUpgrade,
  cryptoPaymentState,
  handleAction: handleSubscriptionAction,
  inProgress,
  modelActiveSubscription,
  operationState,
  operationType,
  resumeSubscription,
} = useSubscriptionActionFlow({
  renewableSubscriptions,
  onActionComplete: async () => {
    await refreshSubscriptions();
  },
});

// Polling setup
useSubscriptionPolling({
  intervalMs: 30000,
  pendingSubscriptions: pending,
  refreshCallback: refreshSubscriptions,
});
</script>

<template>
  <AccountSection
    :title="t('account.subscriptions.title')"
    :description="initialLoading ? undefined : showTable ? t('account.subscriptions.description') : t('account.subscriptions.past_hint', { count: userSubscriptions.length }, userSubscriptions.length)"
  >
    <template
      v-if="initialLoading"
      #description
    >
      <RuiSkeletonLoader class="inline-block align-middle h-3.5 w-56" />
    </template>
    <template #actions>
      <RefreshButton
        v-if="showTable"
        :loading="loading"
        @refresh="refreshSubscriptions()"
      />
      <RuiButton
        v-if="folded && userSubscriptions.length > 0"
        color="primary"
        variant="outlined"
        aria-controls="subscriptions-table"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? t('actions.hide') : t('actions.show') }}
      </RuiButton>
    </template>

    <RuiDataTable
      v-if="showTable"
      id="subscriptions-table"
      v-model:pagination="modelPagination"
      v-bind="tableProps"
      v-model:sort="sort"
      :cols="headers"
      :rows="userSubscriptions"
      :loading="loading"
      :empty="{
        description: t('account.subscriptions.no_subscriptions_found'),
      }"
      row-attr="id"
    >
      <template #item.planName="{ row }">
        {{ getPlanDisplayName(row) }}
      </template>

      <template #item.createdDate="{ row }">
        {{ formatDate(row.createdDate, 'MMM DD, YYYY') }}
      </template>

      <template #item.nextActionDate="{ row }">
        <span :class="{ 'text-rui-text-secondary': !isValidDate(row.nextActionDate) }">
          {{ formatDate(row.nextActionDate, 'MMM DD, YYYY') }}
        </span>
      </template>

      <template #item.nextBillingAmount="{ row }">
        {{ t('account.credit.balance_eur', { amount: n(row.nextBillingAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }) }}
      </template>

      <template #item.status="{ row }">
        <SubscriptionStatusChip
          :subscription="row"
        />
      </template>

      <template #item.actions="{ row }">
        <SubscriptionActionsCell
          :subscription="row"
          :actions-classes="actionsClasses"
          layout="row"
          :available-plans="availablePlans"
          :operation-state="operationState"
          :crypto-payment-state="cryptoPaymentState"
          @action="handleSubscriptionAction($event)"
        />
      </template>
    </RuiDataTable>

    <SubscriptionDialogs
      v-model="modelActiveSubscription"
      :active-action="activeAction"
      :in-progress="inProgress"
      :operation-type="operationType"
      @cancel-subscription="cancelSubscription($event)"
      @resume-subscription="resumeSubscription($event)"
      @cancel-upgrade="cancelUpgrade($event)"
    />
  </AccountSection>
</template>
