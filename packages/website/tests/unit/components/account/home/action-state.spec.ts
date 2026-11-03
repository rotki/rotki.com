import { PaymentProvider, type Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { describe, expect, it } from 'vitest';
import { type ActionChecks, type ActionContext, buildActionState } from '~/components/account/home/subscription-table/action-state';
import { SubscriptionAction } from '~/components/account/home/subscription-table/types';

function subscription(overrides: Partial<UserSubscription> = {}): UserSubscription {
  return {
    actions: ['cancel', 'upgrade'],
    createdDate: '2026-01-01T00:00:00Z',
    durationInMonths: 12,
    id: 'sub-1',
    isActive: true,
    isLegacy: false,
    isSoftCanceled: false,
    nextActionDate: '2027-01-01',
    nextBillingAmount: 450,
    paymentProvider: PaymentProvider.BRAINTREE,
    pending: false,
    planId: 3,
    planName: 'basic',
    status: 'Active',
    ...overrides,
  };
}

/** Checks that read the actions list, the way the real composables do for these cases. */
const checks: ActionChecks = {
  displayActions: () => true,
  getBlockExplorerLink: tx => `https://explorer.test/tx/${tx.hash}`,
  hasAction: (sub, action) => sub.actions.includes(action),
  isCryptoPaymentPending: sub => sub.paymentProvider === PaymentProvider.CRYPTO && sub.pending,
  shouldShowPaymentDetail: sub => sub.pending,
};

function context(overrides: Partial<ActionContext> = {}): ActionContext {
  return {
    actionsClasses: '',
    checks,
    cryptoPaymentState: { pendingTx: null, renewLink: '/checkout/pay/method' },
    operationState: { inProgress: false },
    subscription: subscription(),
    ...overrides,
  };
}

describe('buildActionState', () => {
  it('shows what the backend allows and hides the rest', () => {
    const state = buildActionState(context());

    expect(state.cancel.visible).toBe(true);
    expect(state.upgrade.visible).toBe(true);
    expect(state.renew.visible).toBe(false);
    expect(state.resume.visible).toBe(false);
    expect(state.cancelUpgrade.visible).toBe(false);
  });

  it('shows resume for a cancelled subscription that still runs', () => {
    const state = buildActionState(context({ subscription: subscription({ actions: [], isSoftCanceled: true }) }));

    expect(state.resume.visible).toBe(true);
    expect(state.resume.props.nextActionDate).toBe('2027-01-01');
  });

  it('loads only the subscription being cancelled and hides its upgrade meanwhile', () => {
    const cancelling = context({
      operationState: {
        activeAction: SubscriptionAction.CANCEL,
        activeSubscription: subscription(),
        inProgress: true,
        operationType: SubscriptionAction.CANCEL,
        status: 'pending',
      },
    });

    const state = buildActionState(cancelling);
    expect(state.cancel.props).toMatchObject({ cancellationStatus: 'pending', disabled: true, loading: true });
    expect(state.upgrade.visible).toBe(false);

    const other = buildActionState({ ...cancelling, subscription: subscription({ id: 'sub-2' }) });
    expect(other.cancel.props).toMatchObject({ disabled: true, loading: false });
    expect(other.upgrade.visible).toBe(true);
  });

  it('links a pending crypto payment to its transaction and its payment page', () => {
    const state = buildActionState(context({
      cryptoPaymentState: { pendingTx: { blockExplorerUrl: '', chainId: 1, hash: '0xabc', isUpgrade: false, subscriptionId: 'sub-1' }, renewLink: '' },
      pendingPaymentCurrency: 'ETH',
      subscription: subscription({ actions: [], paymentProvider: PaymentProvider.CRYPTO, pending: true }),
    }));

    expect(state.blockExplorer).toMatchObject({ props: { to: 'https://explorer.test/tx/0xabc' }, visible: true });
    expect(state.paymentDetail.visible).toBe(true);
    expect(state.paymentDetail.props.to).toMatchObject({ path: '/checkout/pay/crypto', query: { currency: 'ETH', planId: '3' } });
  });

  it('pays the requested plan and offers to cancel an upgrade request', () => {
    const state = buildActionState(context({
      subscription: subscription({ actions: [], pending: true, status: 'Upgrade Requested' }),
      upgradePlanId: 1,
    }));

    expect(state.cancelUpgrade.visible).toBe(true);
    expect(state.paymentDetail.props.to).toMatchObject({ query: { planId: '1', upgradeSubId: 'sub-1' } });
  });
});
