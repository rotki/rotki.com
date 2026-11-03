import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { PaymentProvider, type Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { CardVerificationMode, useCardVerification } from '~/composables/account/use-card-verification';

/** The active subscription the mocked `useUserSubscriptions` returns. */
const active = vi.hoisted(() => {
  const holder: { subscription?: UserSubscription } = {};
  return holder;
});

vi.mock('~/composables/subscription/use-user-subscriptions', async () => {
  const { computed } = await import('vue');
  return { useUserSubscriptions: () => ({ activeSubscription: computed(() => active.subscription) }) };
});

vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({ error: vi.fn() }),
}));

const card: SavedCard = { expiresAt: '08/2028', imageUrl: '', last4: '4242', linked: true, token: 'card-1' };

function subscriptionPaidBy(paymentProvider: PaymentProvider): UserSubscription {
  return {
    actions: ['cancel'],
    createdDate: '2026-01-01T00:00:00Z',
    durationInMonths: 12,
    id: 'sub-1',
    isActive: true,
    isLegacy: false,
    isSoftCanceled: false,
    nextActionDate: '2027-01-01',
    nextBillingAmount: 450,
    paymentProvider,
    pending: false,
    planName: 'advanced',
    status: 'Active',
  };
}

type Verification = ReturnType<typeof useCardVerification>;

async function setup() {
  const onError = vi.fn();
  const onVerified = vi.fn().mockResolvedValue(undefined);
  let result: Verification | undefined;
  await mountSuspended(defineComponent({
    setup() {
      result = useCardVerification({ onError, onVerified });
      return () => h('div');
    },
  }));
  return { onError, onVerified, verification: result! };
}

describe('useCardVerification', () => {
  beforeEach(() => {
    active.subscription = undefined;
  });

  it('says so when there is no subscription to verify the card for', async () => {
    const { onError, verification } = await setup();

    verification.start(card, CardVerificationMode.LINK);

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/subscription/i) }));
    expect(verification.modelDialogOpen.value).toBe(false);
  });

  it('refuses a crypto subscription', async () => {
    active.subscription = subscriptionPaidBy(PaymentProvider.CRYPTO);
    const { onError, verification } = await setup();

    verification.start(card, CardVerificationMode.REAUTHORIZE);

    expect(onError).toHaveBeenCalledOnce();
    expect(verification.verificationData.value).toBeUndefined();
  });

  it('opens the dialog with the card and the renewal it will pay', async () => {
    active.subscription = subscriptionPaidBy(PaymentProvider.BRAINTREE);
    const { onVerified, verification } = await setup();

    verification.start(card, CardVerificationMode.REAUTHORIZE);

    expect(verification.modelDialogOpen.value).toBe(true);
    expect(verification.isReauthorization.value).toBe(true);
    expect(verification.verifyingToken.value).toBe('card-1');
    expect(verification.verificationData.value).toEqual({
      cardExpiresAt: '08/2028',
      cardLast4: '4242',
      cardToken: 'card-1',
      subscriptionData: { durationInMonths: 12, nextActionDate: '2027-01-01', nextBillingAmount: 450 },
    });

    await verification.handleVerified();
    expect(onVerified).toHaveBeenCalledOnce();
    expect(verification.modelDialogOpen.value).toBe(false);
    expect(verification.verifyingToken.value).toBeUndefined();
  });

  it('closes the dialog and reports a failed check', async () => {
    active.subscription = subscriptionPaidBy(PaymentProvider.BRAINTREE);
    const { onError, verification } = await setup();
    verification.start(card, CardVerificationMode.LINK);

    verification.handleFailed(new Error('3DS failed'));

    expect(onError).toHaveBeenCalledOnce();
    expect(verification.modelDialogOpen.value).toBe(false);
    expect(verification.verificationData.value).toBeUndefined();
  });
});
