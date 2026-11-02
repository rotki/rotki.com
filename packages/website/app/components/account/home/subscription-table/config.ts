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
    key: 'planName',
    label: t('common.plan'),
    sortable: true,
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
    cellClass: 'tabular-nums',
    label: t('account.subscriptions.headers.price'),
    sortable: true,
  }, {
    key: 'status',
    label: t('common.status'),
    sortable: true,
  }, {
    align: 'end',
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
