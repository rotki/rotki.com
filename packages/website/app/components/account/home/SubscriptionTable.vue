<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { DataTableColumn, DataTableSortColumn, TablePaginationData } from '@rotki/ui-library';
import type { CancelSubscriptionConfirmEvent } from '~/components/account/home/CancelSubscription.vue';
import type {
  CryptoPaymentState,
  OperationState,
  SubscriptionActionEvent,
  SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import { get, set } from '@vueuse/shared';
import AccountSection from '~/components/account/home/AccountSection.vue';
import RefreshButton from '~/components/account/home/RefreshButton.vue';
import { getSubscriptionTableHeaders } from '~/components/account/home/subscription-table/config';
import SubscriptionActionsCell from '~/components/account/home/subscription-table/SubscriptionActionsCell.vue';
import SubscriptionStatusChip from '~/components/account/home/subscription-table/SubscriptionStatusChip.vue';
import SubscriptionDialogs from '~/components/account/home/SubscriptionDialogs.vue';
import { useSubscriptionCryptoPayment } from '~/composables/subscription/use-subscription-crypto-payment';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { useSubscriptionOperations } from '~/composables/subscription/use-subscription-operations';
import { useSubscriptionPolling } from '~/composables/subscription/use-subscription-polling';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { formatDate } from '~/utils/date';
import { fitsOnePage } from '~/utils/table';

const { folded = false } = defineProps<{
  /** Starts folded behind a Show button, for when no subscription has anything left to do. */
  folded?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
const pagination = ref<TablePaginationData>();
const sort = ref<DataTableSortColumn<UserSubscription>>({
  column: 'createdDate',
  direction: 'desc',
});

// Unified action state
const activeAction = ref<SubscriptionActionType>();
const activeSubscription = ref<UserSubscription>();

// Store setup
const subscriptionOpsStore = useSubscriptionOperationsStore();
const {
  inProgress,
  operationType,
  status,
} = storeToRefs(subscriptionOpsStore);

const { availablePlans } = useAvailablePlans();

// Composables
const { userSubscriptions, loading, initialLoading, refresh: refreshSubscriptions } = useUserSubscriptions();
const { getPlanDisplayName, actionsClasses } = useSubscriptionDisplay();

// Use centralized subscription operations composable
const {
  resumeSubscription: performResumeSubscription,
  cancelSubscription: performCancelSubscription,
  cancelUpgrade: performCancelUpgrade,
} = useSubscriptionOperations({
  onActionComplete: async () => {
    await refreshSubscriptions();
  },
});

// Computed properties
const pending = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(sub => sub.pending),
);

const renewableSubscriptions = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(({ actions }) => actions.includes('renew')),
);

const headers = computed<DataTableColumn<UserSubscription>[]>(() => getSubscriptionTableHeaders(t));

const expanded = ref<boolean>(false);
const showTable = computed<boolean>(() => !folded || get(expanded));

// Crypto payment composable
const {
  pendingTx,
  renewLink,
} = useSubscriptionCryptoPayment({
  renewableSubscriptions,
});

// Grouped state for SubscriptionActionsCell
const operationState = computed<OperationState>(() => ({
  inProgress: get(inProgress),
  operationType: get(operationType),
  status: get(status),
  activeAction: get(activeAction),
  activeSubscription: get(activeSubscription),
}));

const cryptoPaymentState = computed<CryptoPaymentState>(() => ({
  pendingTx: get(pendingTx),
  renewLink: get(renewLink),
}));

// Polling setup
useSubscriptionPolling({
  intervalMs: 30000,
  pendingSubscriptions: pending,
  refreshCallback: refreshSubscriptions,
});

async function resumeSubscription(subscription: UserSubscription): Promise<void> {
  await performResumeSubscription(subscription, activeAction, activeSubscription);
}

async function cancelSubscription({ subscription, feedback }: CancelSubscriptionConfirmEvent): Promise<void> {
  await performCancelSubscription(subscription, activeAction, activeSubscription, feedback);
}

async function cancelUpgrade(subscriptionId: string): Promise<void> {
  await performCancelUpgrade(subscriptionId, activeAction, activeSubscription);
}

function handleSubscriptionAction({ action, subscription }: SubscriptionActionEvent): void {
  set(activeAction, action);
  set(activeSubscription, subscription);
}
</script>

<template>
  <AccountSection
    :title="t('account.subscriptions.title')"
    :description="showTable || initialLoading ? undefined : t('account.subscriptions.past_hint', { count: userSubscriptions.length }, userSubscriptions.length)"
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
      v-model:pagination="pagination"
      v-model:sort="sort"
      :cols="headers"
      :rows="userSubscriptions"
      :loading="loading"
      :empty="{
        description: t('account.subscriptions.no_subscriptions_found'),
      }"
      row-attr="id"
      :hide-pagination="fitsOnePage(userSubscriptions)"
      outlined
    >
      <template #item.planName="{ row }">
        {{ getPlanDisplayName(row) }}
      </template>

      <template #item.createdDate="{ row }">
        {{ formatDate(row.createdDate, 'MMM DD, YYYY') }}
      </template>

      <template #item.nextActionDate="{ row }">
        {{ formatDate(row.nextActionDate, 'MMM DD, YYYY') }}
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
          :available-plans="availablePlans"
          :operation-state="operationState"
          :crypto-payment-state="cryptoPaymentState"
          @action="handleSubscriptionAction($event)"
        />
      </template>
    </RuiDataTable>

    <SubscriptionDialogs
      v-model="activeSubscription"
      :active-action="activeAction"
      :in-progress="inProgress"
      :operation-type="operationType"
      @cancel-subscription="cancelSubscription($event)"
      @resume-subscription="resumeSubscription($event)"
      @cancel-upgrade="cancelUpgrade($event)"
    />
  </AccountSection>
</template>
