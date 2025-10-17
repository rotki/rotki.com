<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { DataTableColumn, DataTableSortColumn, TablePaginationData } from '@rotki/ui-library';
import { get, set } from '@vueuse/shared';
import CancelUpgradeDialog from '~/components/account/home/CancelUpgradeDialog.vue';
import { getSubscriptionTableHeaders } from '~/components/account/home/subscription-table/config';
import SubscriptionActionsCell from '~/components/account/home/subscription-table/SubscriptionActionsCell.vue';
import SubscriptionStatusChip from '~/components/account/home/subscription-table/SubscriptionStatusChip.vue';
import SubscriptionTableHeader from '~/components/account/home/subscription-table/SubscriptionTableHeader.vue';
import {
  type CryptoPaymentState,
  type OperationState,
  SubscriptionAction,
  type SubscriptionActionEvent,
  type SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import UpgradePlanDialog from '~/components/account/home/UpgradePlanDialog.vue';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { useTiersStore } from '~/store/tiers';
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

const {
  clearOperation,
  setStatus,
  startOperation,
} = subscriptionOpsStore;

const tiersStore = useTiersStore();
const { availablePlans } = storeToRefs(tiersStore);
const { getAvailablePlans } = tiersStore;

// Composables
const { userSubscriptions, loading, refresh: refreshSubscriptions } = useUserSubscriptions();
const { cancelUserSubscription, resumeUserSubscription } = useSubscription();
const { getPlanDisplayName, actionsClasses } = useSubscriptionDisplay();
const paymentApi = useCryptoPaymentApi();

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

// Action handlers
function clearActiveState(): void {
  clearOperation();
  set(activeAction, undefined);
  set(activeSubscription, undefined);
}

async function resumeSubscription(subscription: UserSubscription): Promise<void> {
  startOperation(SubscriptionAction.RESUME);

  await resumeUserSubscription(subscription, (statusMessage: string) => {
    setStatus(statusMessage);
  });

  await refreshSubscriptions();
  clearActiveState();
}

async function cancelSubscription(subscription: UserSubscription): Promise<void> {
  startOperation(SubscriptionAction.CANCEL);

  await cancelUserSubscription(subscription, (statusMessage: string) => {
    setStatus(statusMessage);
  });

  await refreshSubscriptions();
  clearActiveState();
}

async function cancelUpgrade(subscriptionId: string): Promise<void> {
  startOperation(SubscriptionAction.CANCEL_UPGRADE);
  await paymentApi.cancelUpgradeRequest(subscriptionId);
  await refreshSubscriptions();
  clearActiveState();
}

function handleSubscriptionAction({ action, subscription }: SubscriptionActionEvent): void {
  set(activeAction, action);
  set(activeSubscription, subscription);
}

// Lifecycle hooks
onBeforeMount(() => {
  getAvailablePlans();
});
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

    <CancelSubscription
      v-if="activeAction === SubscriptionAction.CANCEL && activeSubscription"
      v-model="activeSubscription"
      :loading="operationType === SubscriptionAction.CANCEL && inProgress"
      @confirm="cancelSubscription($event)"
    />

    <ResumeSubscriptionDialog
      v-if="activeAction === SubscriptionAction.RESUME && activeSubscription"
      v-model="activeSubscription"
      :loading="operationType === SubscriptionAction.RESUME && inProgress"
      @confirm="resumeSubscription($event)"
    />

    <UpgradePlanDialog
      v-if="activeAction === SubscriptionAction.UPGRADE && activeSubscription"
      v-model="activeSubscription"
    />

    <CancelUpgradeDialog
      v-if="activeAction === SubscriptionAction.CANCEL_UPGRADE && activeSubscription"
      v-model="activeSubscription"
      :loading="operationType === SubscriptionAction.CANCEL_UPGRADE && inProgress"
      @confirm="cancelUpgrade($event)"
    />
  </div>
</template>
