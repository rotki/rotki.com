<script setup lang="ts">
import { get, set, useIntervalFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { type ContextColorsType } from '@rotki/ui-library/dist/consts/colors';
import { type Ref } from 'vue/dist/vue';
import {
  type DataTableColumn,
  type DataTableSortColumn,
  type TablePaginationData,
} from '@rotki/ui-library';
import { useMainStore } from '~/store';
import { type Subscription } from '~/types';

const { t } = useI18n();

const headers: DataTableColumn<Subscription>[] = [
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
    align: 'end',
    class: 'capitalize',
  },
];

const store = useMainStore();
const { subscriptions } = storeToRefs(store);

const pagination: Ref<TablePaginationData | undefined> = ref();
const sort: Ref<DataTableSortColumn<Subscription>[]> = ref([]);
const selectedSubscription: Ref<Subscription | undefined> = ref();
const showCancelDialog: Ref<boolean> = ref(false);
const cancelling: Ref<boolean> = ref(false);

const pending = computed(() => get(subscriptions).filter((sub) => sub.pending));

const renewableSubscriptions = computed(() =>
  get(subscriptions).filter(({ actions }) => actions.includes('renew')),
);

const pendingPaymentCurrency = computedAsync(async () => {
  const subs = get(renewableSubscriptions);
  if (subs.length === 0) {
    return undefined;
  }
  const response = await store.checkPendingCryptoPayment(subs[0].identifier);

  if (response.isError || !response.result.pending) {
    return undefined;
  }

  return response.result.currency;
});

const renewLink = computed<{ path: string; query: Record<string, string> }>(
  () => {
    const link = {
      path: '/checkout/pay/method',
      query: {},
    };

    const subs = get(renewableSubscriptions);

    if (subs.length > 0) {
      const sub = subs[0];
      link.query = {
        plan: sub.durationInMonths.toString(),
        id: sub.identifier,
      };
    }

    if (isDefined(pendingPaymentCurrency)) {
      link.query = {
        ...link.query,
        currency: get(pendingPaymentCurrency),
      };
    }

    return link;
  },
);

const { pause, resume, isActive } = useIntervalFn(
  async () => await store.getAccount(),
  60000,
);

watch(pending, (pending) => {
  if (pending.length === 0) {
    pause();
  } else if (!get(isActive)) {
    resume();
  }
});

onUnmounted(() => pause());

const hasAction = (sub: Subscription, action: 'renew' | 'cancel') => {
  if (action === 'cancel') {
    return sub.status !== 'Pending' && sub.actions.includes('cancel');
  } else if (action === 'renew') {
    return sub.actions.includes('renew');
  }
  return false;
};

const displayActions = (sub: Subscription) =>
  hasAction(sub, 'renew') || hasAction(sub, 'cancel');

const getChipStatusColor = (status: string): ContextColorsType | undefined => {
  const map: Record<string, ContextColorsType> = {
    Active: 'success',
    Cancelled: 'error',
    Pending: 'warning',
    'Past Due': 'warning',
  };

  return map[status];
};

const confirmCancel = (sub: Subscription) => {
  set(selectedSubscription, sub);
  set(showCancelDialog, true);
};

const cancelSubscription = async (sub: Subscription) => {
  set(showCancelDialog, false);
  set(cancelling, true);
  await store.cancelSubscription(sub);
  set(cancelling, false);
  set(selectedSubscription, undefined);
};
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
      :rows="subscriptions"
      :empty="{
        description: t('account.subscriptions.no_subscriptions_found'),
      }"
      row-attr="identifier"
      outlined
    >
      <template #item.status="{ row }">
        <RuiChip size="sm" :color="getChipStatusColor(row.status)">
          {{ row.status }}
        </RuiChip>
      </template>

      <template #item.actions="{ row }">
        <div v-if="displayActions(row)" class="flex gap-2 justify-end">
          <RuiButton
            v-if="hasAction(row, 'cancel')"
            :loading="cancelling"
            variant="text"
            type="button"
            color="warning"
            @click="confirmCancel(row)"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <ButtonLink
            v-if="hasAction(row, 'renew')"
            :disabled="cancelling"
            :to="renewLink"
            color="primary"
          >
            {{ t('actions.renew') }}
          </ButtonLink>
        </div>
        <div v-else class="capitalize">{{ t('common.none') }}</div>
      </template>
    </RuiDataTable>

    <CancelSubscription
      v-model="showCancelDialog"
      :subscription="selectedSubscription"
      @cancel="cancelSubscription($event)"
    />
  </div>
</template>
