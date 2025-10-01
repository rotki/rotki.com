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
import { isCancelledButActive, isSubActive, isSubPending, isSubRequestingUpgrade } from '@rotki/card-payment-common';
import { get, set, useIntervalFn } from '@vueuse/shared';
import CancelUpgradeDialog from '~/components/account/home/CancelUpgradeDialog.vue';
import UpgradePlanDialog from '~/components/account/home/UpgradePlanDialog.vue';
import { getHighestPlanOnPeriod } from '~/components/pricings/utils';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { useTiersStore } from '~/store/tiers';
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
const subscriptionToUpgradeCancel = ref<UserSubscription>();

const subscriptionOpsStore = useSubscriptionOperationsStore();
const {
  cancellationStatus,
  cancelling,
  resumeStatus,
  resuming,
  upgradingSubscription,
  cancellingUpgrade,
} = storeToRefs(subscriptionOpsStore);

const tiersStore = useTiersStore();
const { availablePlans } = storeToRefs(tiersStore);
const { getAvailablePlans } = tiersStore;

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

const pendingPaymentCurrency = computedAsync<string | undefined>(async () => {
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

const actionsClasses = '!px-1 !py-0 hover:underline !leading-[1.2rem] gap-1';
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
  align: 'start',
  class: 'capitalize',
}];

function clickResume(subscription: UserSubscription): void {
  set(subscriptionToResume, subscription);
}

function clickCancel(subscription: UserSubscription): void {
  set(subscriptionToCancel, subscription);
}

function clickCancelUpgrade(subscription: UserSubscription): void {
  set(subscriptionToUpgradeCancel, subscription);
}

// Helper functions for subscription actions
function canCancelSubscription(sub: UserSubscription): boolean {
  return !isSubPending(sub) && !isSubRequestingUpgrade(sub) && sub.actions.includes('cancel');
}

function canRenewSubscription(sub: UserSubscription): boolean {
  return sub.actions.includes('renew');
}

function canUpgradeSubscription(sub: UserSubscription): boolean {
  if (!isSubActive(sub) || sub.isSoftCanceled || sub.isLegacy || !sub.actions.includes('cancel'))
    return false;

  const plans = get(availablePlans);
  if (plans.length === 0)
    return false;

  const highestPlanName = getHighestPlanOnPeriod(plans, sub.durationInMonths);
  return !!highestPlanName && highestPlanName !== sub.planName;
}

function canContinuePayment(sub: UserSubscription): boolean {
  return isSubPending(sub) || isSubRequestingUpgrade(sub);
}

function hasAction(sub: UserSubscription, action: 'renew' | 'cancel' | 'upgrade' | 'continue_payment'): boolean {
  switch (action) {
    case 'cancel':
      return canCancelSubscription(sub);
    case 'renew':
      return canRenewSubscription(sub);
    case 'upgrade':
      return canUpgradeSubscription(sub);
    case 'continue_payment':
      return canContinuePayment(sub);
    default:
      return false;
  }
}

function displayActions(sub: UserSubscription): boolean {
  return canRenewSubscription(sub)
    || canCancelSubscription(sub)
    || canUpgradeSubscription(sub)
    || canContinuePayment(sub)
    || sub.isSoftCanceled;
}

function getChipStatusColor(status: string): ContextColorsType | undefined {
  const map: Record<string, ContextColorsType> = {
    'Active': 'success',
    'Cancelled but still active': 'success',
    'Cancelled': 'error',
    'Pending': 'warning',
    'Upgrade Requested': 'warning',
    'Past Due': 'warning',
  };

  return map[status];
}

function isCryptoPaymentPending(row: UserSubscription): boolean {
  const tx = get(pendingTx);
  if (!tx)
    return false;

  const isPendingWithoutUpgrade = isSubPending(row) && !tx.isUpgrade;
  const isUpgradeWithUpgrade = isSubRequestingUpgrade(row) && tx.isUpgrade;
  return (isPendingWithoutUpgrade || isUpgradeWithUpgrade) && row.id === tx.subscriptionId;
}

function shouldShowPaymentDetail(row: UserSubscription): boolean {
  return (isSubPending(row) || isSubRequestingUpgrade(row)) && !isCryptoPaymentPending(row);
}

function getPlanDisplayName(row: UserSubscription): string {
  if (row.isLegacy)
    return row.planName;

  return getPlanNameFor(t, { name: row.planName, durationInMonths: row.durationInMonths });
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

async function cancelUpgrade(subscriptionId: string): Promise<void> {
  set(cancellingUpgrade, true);
  await paymentApi.cancelUpgradeRequest(subscriptionId);
  await refreshSubscriptions();
  set(cancellingUpgrade, false);
  set(subscriptionToUpgradeCancel, undefined);
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

onBeforeMount(() => getAvailablePlans());
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-h6 mb-6">
      {{ t('account.subscriptions.title') }}
      <RuiButton
        variant="text"
        color="primary"
        icon
        :loading="loading"
        class="!p-2"
        @click="refreshSubscriptions()"
      >
        <RuiIcon
          name="lu-refresh-cw"
          size="16"
        />
      </RuiButton>
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
        {{ getPlanDisplayName(row) }}
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
          <RuiTooltip v-if="isCancelledButActive(row)">
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
              v-if="isCryptoPaymentPending(row)"
              thickness="2"
              variant="indeterminate"
            />
          </template>
        </RuiChip>
      </template>

      <template #item.actions="{ row }">
        <div
          v-if="displayActions(row)"
          class="flex flex-col items-start gap-1"
        >
          <RuiButton
            v-if="hasAction(row, 'upgrade')"
            variant="text"
            type="button"
            color="primary"
            :class="actionsClasses"
            size="sm"
            @click="upgradingSubscription = row"
          >
            <template #prepend>
              <RuiIcon
                name="lu-circle-arrow-up"
                size="12"
              />
            </template>
            {{ t('account.subscriptions.upgrade.upgrade') }}
          </RuiButton>

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
                :class="actionsClasses"
                size="sm"
                @click="clickCancel(row)"
              >
                <template #prepend>
                  <RuiIcon
                    name="lu-circle-x"
                    size="12"
                  />
                </template>
                {{ t('account.subscriptions.actions.cancel') }}
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
            :class="actionsClasses"
            size="sm"
            color="info"
          >
            <template #prepend>
              <RuiIcon
                name="lu-repeat"
                size="12"
              />
            </template>
            {{ t('actions.renew') }}
          </ButtonLink>
          <RuiTooltip
            v-if="isCryptoPaymentPending(row)"
            tooltip-class="w-48"
          >
            <template #activator>
              <ButtonLink
                external
                icon
                color="primary"
                :class="actionsClasses"
                size="sm"
                :to="getBlockExplorerLink(pendingTx)"
              >
                <template #prepend>
                  <RuiIcon
                    name="lu-link"
                    size="12"
                  />
                </template>
                {{ t('account.subscriptions.explorer') }}
              </ButtonLink>
            </template>
            {{ t('account.subscriptions.pending_tx') }}
          </RuiTooltip>
          <!-- link will not work due to middleware if there is a transaction started -->
          <ButtonLink
            v-else-if="shouldShowPaymentDetail(row)"
            :disabled="cancelling"
            :to="pendingPaymentLink"
            :class="actionsClasses"
            color="primary"
            size="sm"
          >
            <template #prepend>
              <RuiIcon
                name="lu-circle-arrow-right"
                size="12"
              />
            </template>
            {{ t('account.subscriptions.payment_detail') }}
          </ButtonLink>
          <RuiButton
            v-if="isSubRequestingUpgrade(row) && !isCryptoPaymentPending(row)"
            color="warning"
            variant="text"
            size="sm"
            :class="actionsClasses"
            :loading="cancellingUpgrade"
            @click="clickCancelUpgrade(row)"
          >
            <template #prepend>
              <RuiIcon
                name="lu-circle-x"
                size="12"
              />
            </template>
            {{ t('account.subscriptions.upgrade.cancel') }}
          </RuiButton>
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
                size="sm"
                :class="actionsClasses"
                @click="clickResume(row)"
              >
                <template #prepend>
                  <RuiIcon
                    name="lu-circle-play"
                    size="12"
                  />
                </template>
                {{ t('account.subscriptions.actions.resume') }}
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

    <UpgradePlanDialog
      v-if="upgradingSubscription"
      v-model="upgradingSubscription"
    />

    <CancelUpgradeDialog
      v-model="subscriptionToUpgradeCancel"
      :loading="cancellingUpgrade"
      @confirm="cancelUpgrade($event)"
    />
  </div>
</template>
