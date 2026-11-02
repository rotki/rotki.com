import { mountSuspended } from '@nuxt/test-utils/runtime';
import { PaymentProvider, type SubscriptionStatus, type Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { useSubscriptionStatus } from '~/composables/subscription/use-subscription-status';

function subscriptionWith(status: SubscriptionStatus): UserSubscription {
  return {
    actions: [],
    createdDate: '2026-01-01T00:00:00Z',
    durationInMonths: 1,
    id: 'sub-1',
    isActive: true,
    isLegacy: false,
    isSoftCanceled: false,
    nextActionDate: '2026-12-01T00:00:00Z',
    nextBillingAmount: 25,
    paymentProvider: PaymentProvider.BRAINTREE,
    pending: false,
    planName: 'basic',
    status,
  };
}

type Status = ReturnType<typeof useSubscriptionStatus>;

/** The composable reads the i18n instance, so it has to run inside a component. */
async function statusOf(status: SubscriptionStatus): Promise<Status> {
  let result: Status | undefined;
  await mountSuspended(defineComponent({
    setup() {
      result = useSubscriptionStatus(subscriptionWith(status));
      return () => h('div');
    },
  }));
  return result!;
}

describe('useSubscriptionStatus', () => {
  it.each<[SubscriptionStatus, string]>([
    ['Active', 'success'],
    ['Cancelled but still active', 'success'],
    ['Pending', 'warning'],
    ['Upgrade Requested', 'warning'],
    ['Past Due', 'warning'],
    ['Payment Failed', 'error'],
  ])('colors %s as %s', async (status, color) => {
    expect((await statusOf(status)).statusColor.value).toBe(color);
  });

  it('shows an ended subscription in grey, not as an error', async () => {
    expect((await statusOf('Cancelled')).statusColor.value).toBe('grey');
  });

  it('names the end date of a cancelled subscription that still runs', async () => {
    const { statusDisplayText } = await statusOf('Cancelled but still active');
    expect(statusDisplayText.value).toContain('December 01, 2026');
  });

  it('shows any other status as the backend names it', async () => {
    expect((await statusOf('Past Due')).statusDisplayText.value).toBe('Past Due');
  });
});
