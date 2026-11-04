import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { AvailablePlansResponse, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { installCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { checkoutMessages } from '@rotki/checkout-ui/messages/en';
import { createTranslator } from '@rotki/checkout-ui/utils/translator';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, type App as VueApp } from 'vue';
import App from './App.vue';

const api = vi.hoisted(() => ({
  canBuyNewSubscription: vi.fn<() => Promise<{ canBuy: boolean; account?: Account }>>(),
  checkout: vi.fn<() => Promise<PaymentBreakdownResponse | null>>(),
  findSelectedPlanById: vi.fn<() => SelectedPlan | undefined>(),
  getActiveCampaign: vi.fn(async () => undefined),
  getAvailablePlans: vi.fn<() => Promise<AvailablePlansResponse | null>>(),
  getSavedCard: vi.fn<() => Promise<SavedCard[]>>(),
  goToSubscription: vi.fn(),
}));

vi.mock('@/utils/api', () => ({
  checkout: api.checkout,
  findSelectedPlanById: api.findSelectedPlanById,
  getActiveCampaign: api.getActiveCampaign,
  getAvailablePlans: api.getAvailablePlans,
}));

vi.mock('@/utils/card-api', () => ({ getSavedCard: api.getSavedCard }));

vi.mock('@/utils/navigation-guard', () => ({ canBuyNewSubscription: api.canBuyNewSubscription }));

vi.mock('@/composables/page-head', () => ({ useCardPageHead: vi.fn() }));

vi.mock('@/utils/navigation', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/utils/navigation')>();
  return { ...original, navigation: { ...original.navigation, goToSubscription: api.goToSubscription } };
});

const CardPayment = defineComponent({
  name: 'CardPayment',
  props: ['cards', 'selectedCard', 'planData', 'selectedPlan', 'upgradeSubId'],
  setup(_, { slots }) {
    return () => h('section', { 'data-cy': 'card-payment' }, slots.methods?.());
  },
});

const plan: SelectedPlan = { planId: 3, name: 'basic', price: 25, durationInMonths: 1 };
const breakdown: PaymentBreakdownResponse = {
  braintreeClientToken: 'client-token',
  discount: null,
  finalAmount: '25.00',
  fullAmount: '25.00',
  nextPayment: 0,
  renewingPrice: '25.00',
  vatAmount: '3.99',
  vatRate: '0.1900',
};
// The plan itself comes from the mocked `findSelectedPlanById`.
const tiers: AvailablePlansResponse = { settings: { country: 'DE', isAuthenticated: true }, tiers: [] };
const account: Account = {
  address: {
    address1: 'First street',
    address2: '',
    city: 'Berlin',
    companyName: '',
    country: 'DE',
    firstName: 'Alice',
    lastName: 'Example',
    movedOffline: false,
    postcode: '10115',
    vatId: '',
  },
  apiKey: '',
  apiSecret: '',
  canUsePremium: false,
  dateNow: '2026-11-04',
  email: 'alice@example.com',
  emailConfirmed: true,
  hasActiveSubscription: false,
  newsletterConsent: false,
  username: 'alice',
  vat: 19,
  vatIdStatus: 'Not checked',
};
const linked: SavedCard = { expiresAt: '11/2029', imageUrl: '', last4: '1111', linked: true, token: 'tok-linked' };
const other: SavedCard = { expiresAt: '10/2028', imageUrl: '', last4: '2222', linked: false, token: 'tok-other' };

function visit(query: string): void {
  window.history.replaceState({}, '', `/checkout/pay/card${query}`);
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function mountApp(): VueWrapper {
  return mount(App, {
    global: {
      plugins: [{ install: (app: VueApp): void => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
      stubs: { CardPayment, CampaignRibbon: true },
    },
  });
}

function cardProps(wrapper: VueWrapper): Record<string, unknown> {
  return wrapper.findComponent({ name: 'CardPayment' }).props();
}

describe('app', () => {
  beforeEach(() => {
    visit('?planId=3');
    api.canBuyNewSubscription.mockResolvedValue({ canBuy: true, account });
    api.checkout.mockResolvedValue(breakdown);
    api.getAvailablePlans.mockResolvedValue(tiers);
    api.findSelectedPlanById.mockReturnValue(plan);
    api.getSavedCard.mockResolvedValue([other, linked]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the page skeleton while it loads', () => {
    api.canBuyNewSubscription.mockReturnValue(new Promise(() => {}));
    const wrapper = mountApp();

    expect(wrapper.find('[data-cy="loading-state"]').exists()).toBe(true);
    expect(wrapper.get('[role="status"]').text()).toBe('Checking authentication...');
  });

  it('asks for the payment data while the account is still being checked', async () => {
    api.canBuyNewSubscription.mockReturnValue(new Promise(() => {}));
    mountApp();
    await flushPromises();

    expect(api.checkout).toHaveBeenCalledWith(3);
    expect(api.getAvailablePlans).toHaveBeenCalled();
    expect(api.getSavedCard).toHaveBeenCalled();
  });

  it('renders the card page before the saved cards arrive, then picks the linked card', async () => {
    const cards = deferred<SavedCard[]>();
    api.getSavedCard.mockReturnValue(cards.promise);
    const wrapper = mountApp();
    await flushPromises();

    expect(cardProps(wrapper).cards).toBeUndefined();

    cards.resolve([other, linked]);
    await flushPromises();

    expect(cardProps(wrapper).cards).toEqual([other, linked]);
    expect(cardProps(wrapper).selectedCard).toEqual(linked);
  });

  it('treats saved cards that fail to load as none, without blocking the page', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    api.getSavedCard.mockRejectedValue(new Error('offline'));
    const wrapper = mountApp();
    await flushPromises();

    expect(cardProps(wrapper).cards).toEqual([]);
  });

  it('offers the other methods for a new subscription', async () => {
    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.find('[data-cy="card-payment"] nav').exists()).toBe(true);
  });

  it('leads an upgrade back to the subscription, without other methods', async () => {
    visit('?planId=3&upgradeSubId=sub-1');
    api.canBuyNewSubscription.mockResolvedValue({ canBuy: false });
    const wrapper = mountApp();
    await flushPromises();

    expect(api.goToSubscription).not.toHaveBeenCalled();
    expect(cardProps(wrapper).upgradeSubId).toBe('sub-1');
    expect(wrapper.find('[data-cy="card-payment"] nav').exists()).toBe(false);
    expect(wrapper.get('a[href$="/home/subscription"]').text()).toContain('Back to your subscription');
  });

  it('sends a buyer who cannot start a subscription to the subscription page', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    api.canBuyNewSubscription.mockResolvedValue({ canBuy: false });
    const wrapper = mountApp();
    await flushPromises();

    expect(api.goToSubscription).toHaveBeenCalledOnce();
    expect(wrapper.find('[data-cy="card-payment"]').exists()).toBe(false);
    expect(wrapper.find('[data-cy="loading-state"]').exists()).toBe(true);
  });

  it.each([
    ['no plan', '', 'No plan selected. Please select a plan first.'],
    ['a plan id that is not a number', '?planId=abc', 'Invalid plan ID. Please select a valid plan.'],
  ])('explains %s before asking the backend anything', async (_, query, message) => {
    visit(query);
    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.text()).toContain(message);
    expect(api.checkout).not.toHaveBeenCalled();
    expect(api.canBuyNewSubscription).not.toHaveBeenCalled();
  });

  it.each([
    ['the breakdown is missing', (): void => { api.checkout.mockResolvedValue(null); }, 'Failed to initialize payment. Please try again.'],
    ['the plans are missing', (): void => { api.getAvailablePlans.mockResolvedValue(null); }, 'Failed to load plan information. Please try again.'],
    ['the plan is unknown', (): void => { api.findSelectedPlanById.mockReturnValue(undefined); }, 'Invalid plan selected. Please try again.'],
  ])('shows an error when %s', async (_, arrange, message) => {
    arrange();
    const wrapper = mountApp();
    await flushPromises();

    expect(wrapper.text()).toContain(message);
    expect(wrapper.find('[data-cy="card-payment"]').exists()).toBe(false);
  });
});
