import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { THREE_D_SECURE_SESSION_KEY } from '@rotki/card-payment-common/schemas/three-d-secure';
import { PaymentUserError } from '@rotki/sigil';
import { err, ok, type Result } from 'plainfp/result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ApiFailure, failed, userFacing } from '@/utils/api-failure';
import { addCard, createCardNonce, reportCardFailure, trackCardPaymentSubmitted } from '@/utils/card-api';
import { findSavedCardBin } from '@/utils/saved-card-bin';
import { type CardCheckoutOptions, useCardCheckout } from './card-checkout';

vi.mock('@/utils/saved-card-bin', () => ({
  findSavedCardBin: vi.fn(),
}));

vi.mock('@/utils/card-api', () => ({
  addCard: vi.fn(),
  createCardNonce: vi.fn(),
  reportCardFailure: vi.fn(() => 'Your bank declined the payment.'),
  trackCardPaymentSubmitted: vi.fn(),
}));

const plan: SelectedPlan = { planId: 3, name: 'basic', price: 25, durationInMonths: 1 };
const savedCard: SavedCard = { expiresAt: '12/30', imageUrl: '', last4: '1111', linked: true, token: 'saved-token' };

const breakdown: PaymentBreakdownResponse = {
  fullAmount: '25.00',
  finalAmount: '22.50',
  vatRate: '0.19',
  vatAmount: '3.59',
  renewingPrice: '25.00',
  nextPayment: 0,
  discount: { isValid: true, isReferral: true, discountType: 'percentage', discountAmount: '10', discountedAmount: '2.50' },
};

function setup(overrides: Partial<CardCheckoutOptions> = {}): { checkout: ReturnType<typeof useCardCheckout>; options: CardCheckoutOptions } {
  const options: CardCheckoutOptions = {
    plan,
    upgradeSubId: undefined,
    clientToken: 'client-token',
    breakdown,
    discountCode: 'DGXXOU',
    client: undefined,
    tokenizeNewCard: vi.fn().mockResolvedValue({ nonce: 'new-nonce', bin: '555555' }),
    onCardSaved: vi.fn(),
    onHandoff: vi.fn(),
    ...overrides,
  };
  return { checkout: useCardCheckout(options), options };
}

function storedHandoff(): Record<string, unknown> {
  return JSON.parse(sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY) ?? '{}');
}

describe('composables/card-checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.mocked(createCardNonce).mockResolvedValue(ok('payment-nonce'));
    vi.mocked(addCard).mockResolvedValue(ok('new-token'));
    vi.mocked(findSavedCardBin).mockResolvedValue('411111');
  });

  it('stays on the page without a handoff when the vault does not have the saved card', async () => {
    vi.mocked(findSavedCardBin).mockRejectedValue(new Error('no vault entry'));
    const { checkout, options } = setup();

    await checkout.submit(savedCard);

    expect(createCardNonce).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY)).toBeNull();
    expect(options.onHandoff).not.toHaveBeenCalled();
    expect(checkout.processing.value).toBe(false);
    expect(checkout.transactionError.value).toBeTruthy();
  });

  it('hands a saved card payment to the 3D Secure page', async () => {
    const { checkout, options } = setup();

    await checkout.submit(savedCard);

    expect(findSavedCardBin).toHaveBeenCalledWith(undefined, savedCard);
    expect(createCardNonce).toHaveBeenCalledWith({ paymentToken: 'saved-token' });
    expect(storedHandoff()).toMatchObject({ nonce: 'payment-nonce', bin: '411111', discountCode: 'DGXXOU', finalAmount: '22.5' });
    expect(options.onHandoff).toHaveBeenCalledOnce();
    expect(trackCardPaymentSubmitted).toHaveBeenCalledWith(expect.objectContaining({ cardType: 'saved', discountApplied: true }));
    // Stays busy while the page navigates, so the button cannot submit twice.
    expect(checkout.processing.value).toBe(true);
  });

  it('vaults a new card before paying with it', async () => {
    const { checkout, options } = setup();

    await checkout.submit(undefined);

    expect(addCard).toHaveBeenCalledWith({ paymentMethodNonce: 'new-nonce' });
    expect(options.onCardSaved).toHaveBeenCalledOnce();
    expect(createCardNonce).toHaveBeenCalledWith({ paymentToken: 'new-token' });
    expect(storedHandoff()).toMatchObject({ bin: '555555' });
  });

  it('shows the error and frees the button when the payment fails', async () => {
    vi.mocked(createCardNonce).mockResolvedValue(err(failed('declined')));
    const { checkout, options } = setup();

    await checkout.submit(savedCard);

    expect(reportCardFailure).toHaveBeenCalledWith(new Error('declined'), expect.objectContaining({ step: 'submit', cardType: 'saved' }));
    expect(checkout.transactionError.value).toBe('Your bank declined the payment.');
    expect(checkout.processing.value).toBe(false);
    expect(options.onHandoff).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(THREE_D_SECURE_SESSION_KEY)).toBeNull();
  });

  it('reports what the Braintree SDK throws as it is', async () => {
    const thrown = new Error('tokenization failed');
    const { checkout } = setup({ tokenizeNewCard: vi.fn().mockRejectedValue(thrown) });

    await checkout.submit(undefined);

    expect(reportCardFailure).toHaveBeenCalledWith(thrown, expect.objectContaining({ step: 'submit', cardType: 'new' }));
    expect(checkout.processing.value).toBe(false);
  });

  it('stops without a nonce when adding the card fails', async () => {
    vi.mocked(addCard).mockResolvedValue(err(userFacing('Try another card', 'declined', false)));
    const { checkout, options } = setup();

    await checkout.submit(undefined);

    expect(reportCardFailure).toHaveBeenCalledWith(expect.any(PaymentUserError), expect.anything());
    expect(createCardNonce).not.toHaveBeenCalled();
    expect(options.onCardSaved).not.toHaveBeenCalled();
    expect(checkout.processing.value).toBe(false);
  });

  it('refreshes the saved cards when the card was vaulted but adding it failed', async () => {
    vi.mocked(addCard).mockResolvedValue(err(userFacing('We couldn\'t process this payment method.', 'Do Not Honor', true)));
    const { checkout, options } = setup();

    await checkout.submit(undefined);

    expect(options.onCardSaved).toHaveBeenCalledOnce();
    expect(createCardNonce).not.toHaveBeenCalled();
  });

  it('does not get stuck when the client token is missing', async () => {
    const { checkout } = setup({ clientToken: undefined });

    await checkout.submit(savedCard);

    expect(checkout.processing.value).toBe(false);
    expect(checkout.transactionError.value).toBeTruthy();
    expect(createCardNonce).not.toHaveBeenCalled();
  });

  it('ignores a second submit while the first is running', async () => {
    let release: (value: Result<string, ApiFailure>) => void = () => {};
    vi.mocked(createCardNonce).mockReturnValue(new Promise((resolve) => {
      release = resolve;
    }));
    const { checkout } = setup();

    const first = checkout.submit(savedCard);
    await checkout.submit(savedCard);
    release(ok('payment-nonce'));
    await first;

    expect(createCardNonce).toHaveBeenCalledOnce();
  });

  it('says the form is not ready when the new card form is missing', async () => {
    const { checkout } = setup({ tokenizeNewCard: vi.fn().mockResolvedValue(undefined) });

    await checkout.submit(undefined);

    expect(addCard).not.toHaveBeenCalled();
    expect(checkout.processing.value).toBe(false);
    expect(checkout.transactionError.value).toBeTruthy();
  });
});
