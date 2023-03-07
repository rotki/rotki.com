<script setup lang="ts">
import { get, useIntervalFn } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { type Subscription } from '~/types';
import { type DataTableHeader } from '~/types/common';

const headers: DataTableHeader[] = [
  { text: 'Plan', value: '' },
  { text: 'Created', value: '', sortable: true },
  { text: 'Next Billing', value: '', sortable: true },
  { text: 'Cost in € per period', value: '', sortable: true },
  { text: 'Status', value: '' },
  { text: 'Actions', value: '', className: 'text-right' },
];

const store = useMainStore();
const { account, cancellationError } = storeToRefs(store);

const subscriptions = computed(() => {
  const userAccount = get(account);
  if (!userAccount) {
    return [];
  }
  return userAccount.subscriptions;
});

const pending = computed(() => get(subscriptions).filter((sub) => sub.pending));

const renewableSubscriptions = computed(() => {
  return get(subscriptions).filter(({ actions }) => actions.includes('renew'));
});

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
      path: '/checkout/payment-method',
      query: {},
    };

    const subs = get(renewableSubscriptions);

    if (subs.length > 0) {
      const sub = subs[0];
      link.query = {
        p: sub.durationInMonths.toString(),
        id: sub.identifier,
      };
    }

    if (isDefined(pendingPaymentCurrency)) {
      link.query = {
        ...link.query,
        c: get(pendingPaymentCurrency),
      };
    }

    return link;
  }
);

const { pause, resume, isActive } = useIntervalFn(
  async () => await store.getAccount(),
  60000
);

watch(pending, (pending) => {
  if (pending.length === 0) {
    pause();
  } else if (!get(isActive)) {
    resume();
  }
});

onUnmounted(() => pause());

const canUsePremium = computed(() => {
  const arePending = get(pending);
  return get(account)?.canUsePremium || arePending.length > 0;
});

const hasAction = (sub: Subscription, action: 'renew' | 'cancel') => {
  if (action === 'cancel') {
    return sub.status !== 'Pending' && sub.actions.includes('cancel');
  } else if (action === 'renew') {
    return sub.actions.includes('renew');
  }
  return false;
};

const displayActions = (sub: Subscription) => {
  return hasAction(sub, 'renew') || hasAction(sub, 'cancel');
};

const css = useCssModule();
</script>

<template>
  <div>
    <PremiumPlaceholder v-if="!canUsePremium" :class="css.purchase" />
    <DataTable
      v-if="subscriptions.length > 0"
      :headers="headers"
      :items="subscriptions"
    >
      <template #title>Subscription History</template>
      <template #item="{ item }">
        <td :class="css.td">
          {{ item.planName }}
        </td>
        <td :class="css.td">
          <div :class="css.text">
            {{ item.createdDate }}
          </div>
        </td>
        <td :class="css.td">
          <div :class="css.text">
            {{ item.nextActionDate }}
          </div>
        </td>
        <td :class="css.td">
          <div :class="css.text">
            {{ item.nextBillingAmount }}
          </div>
        </td>
        <td :class="css.td">
          <span
            :class="{
              [css.status]: true,
              [css.active]: item.status === 'Active',
              [css.cancelled]: item.status === 'Cancelled',
              [css.pending]: item.status === 'Pending',
              [css.pastDue]: item.status === 'Past Due',
            }"
          >
            {{ item.status }}
          </span>
        </td>
        <td :class="css.action">
          <div v-if="displayActions(item)">
            <CancelSubscription
              v-if="hasAction(item, 'cancel')"
              :subscription="item"
            />
            <NuxtLink
              v-if="hasAction(item, 'renew')"
              :class="css.actionButton"
              :to="renewLink"
            >
              Renew
            </NuxtLink>
          </div>
          <div v-else>None</div>
        </td>
      </template>
    </DataTable>
    <ErrorNotification :visible="!!cancellationError">
      <template #title>Cancellation Failure</template>
      <template #description>
        {{ cancellationError }}
      </template>
    </ErrorNotification>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';

.td {
  @apply px-6 py-4 whitespace-nowrap;
}

.text {
  @apply text-sm text-gray-500;
}

.action {
  @apply px-6 py-4 whitespace-nowrap text-right text-sm font-medium;
}

.actionButton {
  @apply text-indigo-600 hover:text-indigo-900;
}

.status {
  @apply px-2 inline-flex text-xs leading-5 font-semibold rounded-full;
}

.active {
  @apply bg-green-100 text-green-800;
}

.cancelled {
  @apply bg-red-100 text-red-600;
}

.pending {
  @apply bg-yellow-100 text-yellow-600;
}

.pastDue {
  @apply bg-yellow-300 text-yellow-800;
}

.purchase {
  @apply mb-8;
}
</style>
