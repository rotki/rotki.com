<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type {
  ContextColorsType,
  DataTableColumn,
  DataTableSortColumn,
  TablePaginationData,
} from '@rotki/ui-library';
import type { RouteLocationRaw } from 'vue-router';
import type { PendingTx } from '~/types';
import { get, set, useIntervalFn } from '@vueuse/shared';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { PaymentMethod } from '~/types/payment';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';

const { t } = useI18n({ useScope: 'global' });

const pagination = ref<TablePaginationData>();
const sort = ref<DataTableSortColumn<UserSubscription>>({
  column: 'createdDate',
  direction: 'desc',
});
const subscriptionToCancel = ref<UserSubscription>();
const subscriptionToResume = ref<UserSubscription>();

const subscriptionOpsStore = useSubscriptionOperationsStore();
const {
  cancellationStatus,
  cancelling,
  resumeStatus,
  resuming,
} = storeToRefs(subscriptionOpsStore);
const {
  clearCancellationState,
  clearResumeState,
  setCancellationStatus,
  setCancelling,
  setResumeStatus,
  setResuming,
} = subscriptionOpsStore;

const { userSubscriptions, loading, refresh: refreshSubscriptions } = useUserSubscriptions();
const { cancelUserSubscription, resumeUserSubscription } = useSubscription();
const pendingTx = usePendingTx();
const paymentApi = useCryptoPaymentApi();
const { pause, resume, isActive } = useIntervalFn(
  async () => await refreshSubscriptions(),
  60000,
);

const pending = computed<UserSubscription[]>(() => get(userSubscriptions).filter(sub => sub.pending));

const renewableSubscriptions = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(({ actions }) => actions.includes('renew')),
);

const pendingPaymentCurrency = computedAsync(async () => {
  const subs = get(renewableSubscriptions);
  if (subs.length === 0)
    return undefined;

  const response = await paymentApi.checkPendingCryptoPayment(subs[0].id);

  if (response.isError || !response.result.pending)
    return undefined;

  return response.result.currency;
});

const renewLink = computed<{ path: string; query: Record<string, string> }>(() => {
  const link = {
    path: '/checkout/pay/request-crypto',
    query: {},
  };

  const subs = get(renewableSubscriptions);

  if (subs.length > 0) {
    const sub = subs[0];
    const durationInMonths = sub.durationInMonths === 12 ? 12 : 1;
    link.query = {
      plan: durationInMonths.toString(),
      id: sub.id,
      method: PaymentMethod.BLOCKCHAIN,
    };
  }

  if (isDefined(pendingPaymentCurrency)) {
    link.query = {
      ...link.query,
      method: PaymentMethod.BLOCKCHAIN,
      currency: get(pendingPaymentCurrency),
    };
  }

  return link;
});

const pendingPaymentLink: RouteLocationRaw = { path: '/checkout/pay/method' };

const headers: DataTableColumn<UserSubscription>[] = [{
  label: t('common.plan'),
  key: 'planName',
  cellClass: 'font-bold',
  class: 'capitalize',
}, {
  label: t('account.subscriptions.headers.created'),
  key: 'createdDate',
  sortable: true,
}, {
  label: t('account.subscriptions.headers.next_billing'),
  key: 'nextActionDate',
  sortable: true,
}, {
  label: t('account.subscriptions.headers.cost_in_symbol_per_period', {
    symbol: '€',
  }),
  key: 'nextBillingAmount',
  sortable: true,
  align: 'end',
}, { label: t('common.status'), key: 'status', class: 'capitalize' }, {
  label: t('common.actions'),
  key: 'actions',
  align: 'end',
  class: 'capitalize',
}];

function isPending(subscription: UserSubscription): boolean {
  return subscription.status === 'Pending';
}

function clickResume(subscription: UserSubscription): void {
  set(subscriptionToResume, subscription);
}

function clickCancel(subscription: UserSubscription): void {
  set(subscriptionToCancel, subscription);
}

function hasAction(subscription: UserSubscription, action: 'renew' | 'cancel'): boolean {
  if (action === 'cancel')
    return subscription.status !== 'Pending' && subscription.actions.includes('cancel');
  else if (action === 'renew')
    return subscription.actions.includes('renew');

  return false;
}

function displayActions(subscription: UserSubscription): boolean {
  return hasAction(subscription, 'renew')
    || hasAction(subscription, 'cancel')
    || isPending(subscription)
    || subscription.isSoftCanceled;
}

function getChipStatusColor(status: string): ContextColorsType | undefined {
  const map: Record<string, ContextColorsType> = {
    'Active': 'success',
    'Cancelled but still active': 'success',
    'Cancelled': 'error',
    'Pending': 'warning',
    'Past Due': 'warning',
  };

  return map[status];
}

function getBlockExplorerLink(pending: PendingTx): RouteLocationRaw {
  return {
    path: `${pending.blockExplorerUrl}/${pending.hash}`,
  };
}

async function resumeSubscription(subscription: UserSubscription): Promise<void> {
  clearResumeState();
  setResuming(true);

  await resumeUserSubscription(subscription, (status: string) => {
    setResumeStatus(status);
  });

  await refreshSubscriptions();
  clearResumeState();
  set(subscriptionToResume, undefined);
}

async function cancelSubscription(subscription: UserSubscription): Promise<void> {
  clearCancellationState();
  setCancelling(true);

  await cancelUserSubscription(subscription, (status: string) => {
    setCancellationStatus(status);
  });

  await refreshSubscriptions();
  clearCancellationState();
  set(subscriptionToCancel, undefined);
}

// Watchers
watch(pending, (pending) => {
  if (pending.length === 0)
    pause();
  else if (!get(isActive))
    resume();
});

// Lifecycle hooks
onUnmounted(() => pause());
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account.subscriptions.title') }}
    </div>
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
        {{ row.isLegacy ? row.planName : getPlanNameFor(t, { name: row.planName, durationInMonths: row.durationInMonths }) }}
      </template>
      <template #item.createdDate="{ row }">
        {{ formatDate(row.createdDate) }}
      </template>
      <template #item.nextActionDate="{ row }">
        {{ formatDate(row.nextActionDate) }}
      </template>
      <template #item.status="{ row }">
        <RuiChip
          size="sm"
          :color="getChipStatusColor(row.status)"
        >
          <RuiTooltip v-if="row.status === 'Cancelled but still active'">
            <template #activator>
              <div class="flex py-0.5 items-center gap-1">
                <RuiIcon
                  size="16"
                  class="text-white"
                  name="lu-info"
                />
                {{ t('account.subscriptions.cancelled_but_still_active.status', { date: formatDate(row.nextActionDate) }) }}
              </div>
            </template>
            {{ t('account.subscriptions.cancelled_but_still_active.description', { date: formatDate(row.nextActionDate) }) }}
          </RuiTooltip>
          <template v-else>
            {{ row.status }}
            <RuiProgress
              v-if="isPending(row) && pendingTx && row.id === pendingTx.subscriptionId"
              thickness="2"
              variant="indeterminate"
            />
          </template>
        </RuiChip>
      </template>

      <template #item.actions="{ row }">
        <div
          v-if="displayActions(row)"
          class="flex gap-2 justify-end"
        >
          <RuiTooltip
            v-if="hasAction(row, 'cancel')"
            :disabled="!cancelling"
          >
            <template #activator>
              <RuiButton
                :loading="cancelling && subscriptionToCancel?.id === row.id"
                :disabled="cancelling"
                variant="text"
                type="button"
                color="error"
                @click="clickCancel(row)"
              >
                {{ t('actions.cancel') }}
              </RuiButton>
            </template>
            <span v-if="cancelling && subscriptionToCancel?.id === row.id && cancellationStatus">
              {{ t(`account.subscriptions.cancellation.status.${cancellationStatus}`) }}
            </span>
          </RuiTooltip>
          <ButtonLink
            v-if="hasAction(row, 'renew')"
            :disabled="cancelling"
            :to="renewLink"
            color="primary"
          >
            {{ t('actions.renew') }}
          </ButtonLink>
          <RuiTooltip
            v-if="pendingTx && row.id === pendingTx.subscriptionId"
            tooltip-class="w-48"
          >
            <template #activator>
              <ButtonLink
                external
                icon
                color="primary"
                :to="getBlockExplorerLink(pendingTx)"
              >
                <RuiIcon
                  name="lu-link"
                  :size="18"
                />
              </ButtonLink>
            </template>
            {{ t('account.subscriptions.pending_tx') }}
          </RuiTooltip>
          <!-- link will not work due to middleware if there is a transaction started -->
          <ButtonLink
            v-else-if="isPending(row)"
            :disabled="cancelling"
            :to="pendingPaymentLink"
            color="primary"
          >
            {{ t('account.subscriptions.payment_detail') }}
          </ButtonLink>
          <RuiTooltip
            v-if="row.isSoftCanceled"
            :disabled="!resuming"
          >
            <template #activator>
              <RuiButton
                :loading="resuming && subscriptionToResume?.id === row.id"
                :disabled="resuming"
                variant="text"
                type="button"
                color="info"
                @click="clickResume(row)"
              >
                {{ t('actions.resume') }}
              </RuiButton>
            </template>
            <span v-if="resuming && subscriptionToResume?.id === row.id && resumeStatus">
              {{ t(`account.subscriptions.resume.status.${resumeStatus}`) }}
            </span>
            <span v-else>
              {{ t('account.subscriptions.resume_hint', { date: row.nextActionDate }) }}
            </span>
          </RuiTooltip>
        </div>
        <div
          v-else
          class="capitalize m-2"
        >
          {{ t('common.none') }}
        </div>
      </template>
    </RuiDataTable>

    <CancelSubscription
      v-model="subscriptionToCancel"
      :loading="cancelling"
      @confirm="cancelSubscription($event)"
    />

    <ResumeSubscriptionDialog
      v-model="subscriptionToResume"
      :loading="resuming"
      @confirm="resumeSubscription($event)"
    />
  </div>
</template>
