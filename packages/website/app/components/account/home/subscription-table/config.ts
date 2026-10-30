import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { DataTableColumn } from '@rotki/ui-library';
import type { ComposerTranslation } from 'vue-i18n';
import type { RouteLocationRaw } from 'vue-router';

/**
 * Get table column definitions for the subscription table
 */
export function getSubscriptionTableHeaders(t: ComposerTranslation): DataTableColumn<UserSubscription>[] {
  return [{
    cellClass: 'font-medium',
    class: 'capitalize',
    key: 'planName',
    label: t('common.plan'),
  }, {
    cellClass: 'whitespace-nowrap',
    key: 'createdDate',
    label: t('account.subscriptions.headers.created'),
    sortable: true,
  }, {
    cellClass: 'whitespace-nowrap',
    key: 'nextActionDate',
    label: t('account.subscriptions.headers.next_billing'),
    sortable: true,
  }, {
    align: 'end',
    key: 'nextBillingAmount',
    label: t('account.subscriptions.headers.cost_in_symbol_per_period', {
      symbol: '€',
    }),
    sortable: true,
  }, {
    class: 'capitalize',
    key: 'status',
    label: t('common.status'),
  }, {
    align: 'start',
    class: 'capitalize',
    key: 'actions',
    label: t('common.actions'),
  }];
}

/**
 * Pending payment link route
 */
export function getPendingPaymentLink(planId: number | undefined, currency: string | undefined, upgradeSubId?: string): RouteLocationRaw {
  return {
    path: '/checkout/pay/crypto',
    query: {
      planId: planId?.toString(),
      currency,
      ...(upgradeSubId ? { upgradeSubId } : {}),
    },
  };
}
