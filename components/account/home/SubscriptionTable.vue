<script setup lang="ts">
import type {
  ContextColorsType,
  DataTableColumn,
  DataTableSortColumn,
  TablePaginationData,
} from '@rotki/ui-library';
import type { RouteLocationRaw } from 'vue-router';
import type { PendingTx, UserSubscription } from '~/types';
import { get, set, useIntervalFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import UpgradePlanDialog from '~/components/account/home/UpgradePlanDialog.vue';
import { getHighestPlanOnPeriod } from '~/components/pricings/utils';
import { useMainStore } from '~/store';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { useTiersStore } from '~/store/tiers';
import { PaymentMethod } from '~/types/payment';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';
import { isSubActive, isSubPending, isSubRequestingUpgrade } from '~/utils/subscription';

// Component state
const pagination = ref<TablePaginationData>();
const sort = ref<DataTableSortColumn<UserSubscription>[]>([
  {
    column: 'createdDate',
    direction: 'desc',
  },
]);
const selectedSubscription = ref<UserSubscription>();
const showCancelDialog = ref<boolean>(false);
const cancelling = ref<boolean>(false);
const resuming = ref<boolean>(false);
const resumingSubscription = ref<UserSubscription>();
const upgradingSubscription = ref<UserSubscription>();
const cancellingUpgrade = ref<boolean>(false);

// i18n
const { t } = useI18n({ useScope: 'global' });

// Store references
const store = useMainStore();
const { getSubscriptions } = store;
const { userSubscriptions, userSubscriptionsLoading } = storeToRefs(store);
const { availablePlans } = storeToRefs(useTiersStore());
const { checkPendingCryptoPayment, cancelUpgradeRequest } = usePaymentCryptoStore();

// Composables
const { cancelUserSubscription, resumeUserSubscription } = useSubscription();
const pendingTx = usePendingTx();
const { pause, resume, isActive } = useIntervalFn(
  async () => await getSubscriptions(),
  60000,
);

// Constants
const actionsClasses = '!px-1 !py-0 hover:underline !leading-[1.2rem] gap-1';
const pendingPaymentLink: RouteLocationRaw = { path: '/checkout/pay/method' };

// Table headers configuration
const headers: DataTableColumn<UserSubscription>[] = [
  {
    label: t('common.plan'),
    key: 'planName',
    cellClass: 'font-bold',
    class: 'capitalize',
  },
  {
    label: t('account.subscriptions.headers.created'),
    key: 'createdDate',
    sortable: true,
  },
  {
    label: t('account.subscriptions.headers.next_billing'),
    key: 'nextActionDate',
    sortable: true,
  },
  {
    label: t('account.subscriptions.headers.cost_in_symbol_per_period', {
      symbol: '€',
    }),
    key: 'nextBillingAmount',
    sortable: true,
    align: 'end',
  },
  { label: t('common.status'), key: 'status', class: 'capitalize' },
  {
    label: t('common.actions'),
    key: 'actions',
    align: 'start',
    class: 'capitalize',
  },
];

// Computed properties
const pending = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(sub => sub.pending),
);

const renewableSubscriptions = computed<UserSubscription[]>(() =>
  get(userSubscriptions).filter(({ actions }) => actions.includes('renew')),
);

const pendingPaymentCurrency = computedAsync<string | undefined>(async () => {
  const subs = get(renewableSubscriptions);
  if (subs.length === 0)
    return undefined;

  const response = await checkPendingCryptoPayment(subs[0].id);

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
    link.query = {
      plan: sub.durationInMonths.toString(),
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

// Template helper functions
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

function isCancelledButActive(row: UserSubscription): boolean {
  return row.status === 'Cancelled but still active';
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

// Action handlers
function confirmCancel(sub: UserSubscription): void {
  set(selectedSubscription, sub);
  set(showCancelDialog, true);
}

async function cancelSubscription(sub: UserSubscription): Promise<void> {
  set(showCancelDialog, false);
  set(cancelling, true);
  await cancelUserSubscription(sub);
  set(cancelling, false);
  set(selectedSubscription, undefined);
}

async function resumeSubscription(sub: UserSubscription): Promise<void> {
  set(resuming, true);
  await resumeUserSubscription(sub);
  set(resuming, false);
}

async function cancelUpgrade(subscriptionId: string): Promise<void> {
  set(cancellingUpgrade, true);
  await cancelUpgradeRequest(subscriptionId);
  set(cancellingUpgrade, false);
}

// Watchers
watch(pending, (pendingList) => {
  if (pendingList.length === 0)
    pause();
  else if (!get(isActive))
    resume();
});

// Lifecycle
onUnmounted(() => pause());
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-h6 mb-6">
      {{ t('account.subscriptions.title') }}
      <RuiButton
        variant="text"
        color="primary"
        icon
        :loading="userSubscriptionsLoading"
        class="!p-2"
        @click="getSubscriptions()"
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
      :loading="userSubscriptionsLoading"
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
          <RuiButton
            v-if="hasAction(row, 'cancel')"
            :loading="cancelling"
            variant="text"
            type="button"
            color="error"
            :class="actionsClasses"
            size="sm"
            @click="confirmCancel(row)"
          >
            <template #prepend>
              <RuiIcon
                name="lu-circle-x"
                size="12"
              />
            </template>
            {{ t('account.subscriptions.actions.cancel') }}
          </RuiButton>
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
            v-if="isSubRequestingUpgrade(row)"
            color="warning"
            variant="text"
            size="sm"
            :class="actionsClasses"
            :loading="cancellingUpgrade"
            @click="cancelUpgrade(row.id)"
          >
            <template #prepend>
              <RuiIcon
                name="lu-circle-x"
                size="12"
              />
            </template>
            {{ t('account.subscriptions.upgrade.cancel') }}
          </RuiButton>
          <RuiTooltip v-if="row.isSoftCanceled">
            <template #activator>
              <RuiButton
                :loading="resuming"
                variant="text"
                type="button"
                color="info"
                size="sm"
                :class="actionsClasses"
                @click="resumingSubscription = row"
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
            {{ t('account.subscriptions.resume_hint', { date: row.nextActionDate }) }}
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
      v-model="showCancelDialog"
      :subscription="selectedSubscription"
      @cancel="cancelSubscription($event)"
    />

    <ResumeSubscriptionDialog
      v-model="resumingSubscription"
      @confirm="resumeSubscription($event)"
    />

    <UpgradePlanDialog
      v-if="upgradingSubscription"
      v-model="upgradingSubscription"
    />
  </div>
</template>
