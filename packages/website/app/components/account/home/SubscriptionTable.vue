<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { DataTableColumn, DataTableSortColumn, TablePaginationData } from '@rotki/ui-library';
import type {
  CryptoPaymentState,
  OperationState,
  SubscriptionActionEvent,
  SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import { get, set } from '@vueuse/shared';
import { getSubscriptionTableHeaders } from '~/components/account/home/subscription-table/config';
import SubscriptionActionsCell from '~/components/account/home/subscription-table/SubscriptionActionsCell.vue';
import SubscriptionStatusChip from '~/components/account/home/subscription-table/SubscriptionStatusChip.vue';
import SubscriptionTableHeader from '~/components/account/home/subscription-table/SubscriptionTableHeader.vue';
import SubscriptionDialogs from '~/components/account/home/SubscriptionDialogs.vue';
import { useSubscriptionCryptoPayment } from '~/composables/subscription/use-subscription-crypto-payment';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { useSubscriptionOperations } from '~/composables/subscription/use-subscription-operations';
import { useSubscriptionPolling } from '~/composables/subscription/use-subscription-polling';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { formatDate } from '~/utils/date';

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
const { userSubscriptions, loading, refresh: refreshSubscriptions } = useUserSubscriptions();
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

// Action handlers using centralized composable
async function resumeSubscription(subscription: UserSubscription): Promise<void> {
  await performResumeSubscription(subscription, activeAction, activeSubscription);
}

async function cancelSubscription(subscription: UserSubscription): Promise<void> {
  await performCancelSubscription(subscription, activeAction, activeSubscription);
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
  <div>
    <SubscriptionTableHeader
      :loading="loading"
      @refresh="refreshSubscriptions()"
    />

    <RuiDataTable
      v-model:pagination="pagination"
      v-model:sort="sort"
      :cols="headers"
      :rows="userSubscriptions"
      :loading="loading"
      :empty="{
        description: t('account.subscriptions.no_subscriptions_found'),
      }"
      row-attr="id"
      outlined
    >
      <template #item.planName="{ row }">
        {{ getPlanDisplayName(row) }}
      </template>

      <template #item.createdDate="{ row }">
        {{ formatDate(row.createdDate) }}
      </template>

      <template #item.nextActionDate="{ row }">
        {{ formatDate(row.nextActionDate) }}
      </template>

      <template #item.status="{ row }">
        <SubscriptionStatusChip
          :subscription="row"
          :pending-tx="pendingTx"
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
  </div>
</template>
