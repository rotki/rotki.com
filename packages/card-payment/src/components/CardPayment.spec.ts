import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { VatIdStatus } from '@rotki/card-payment-common/schemas/account';
import { installCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { checkoutMessages } from '@rotki/checkout-ui/messages/en';
import { createTranslator } from '@rotki/checkout-ui/utils/translator';
import { mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type App, ref } from 'vue';
import CardPayment from './CardPayment.vue';

const state = vi.hoisted(() => ({
  submit: vi.fn(),
  setTransactionError: vi.fn(),
}));

const breakdown = ref<PaymentBreakdownResponse>();
const transactionError = ref<string>();
const processing = ref<boolean>(false);

vi.mock('@/composables/braintree-client', () => ({
  useBraintreeClient: () => ({ client: ref({}) }),
}));

vi.mock('@/composables/payment-breakdown', () => ({
  usePaymentBreakdown: () => ({ breakdown, loading: ref<boolean>(false) }),
}));

vi.mock('@/composables/card-checkout', () => ({
  useCardCheckout: () => ({
    processing,
    setTransactionError: state.setTransactionError,
    submit: state.submit,
    transactionError,
  }),
}));

const plan: SelectedPlan = { planId: 3, name: 'basic', price: 25, durationInMonths: 1 };
const savedCard: SavedCard = { expiresAt: '11/2029', imageUrl: '', last4: '1111', linked: true, token: 'tok-1' };

const planData: PaymentBreakdownResponse = {
  braintreeClientToken: 'client-token',
  discount: null,
  finalAmount: '25.00',
  fullAmount: '25.00',
  nextPayment: 1796256000,
  renewingPrice: '25.00',
  vatAmount: '3.99',
  vatRate: '0.1900',
};

type Props = InstanceType<typeof CardPayment>['$props'];

function mountPage(props: Partial<Props> = {}): VueWrapper {
  return mount(CardPayment, {
    global: {
      plugins: [{ install: (app: App): void => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
      stubs: { CardDetails: { template: '<section data-testid="card-details" />' }, Teleport: true },
    },
    props: { cards: [savedCard], planData, selectedCard: savedCard, selectedPlan: plan, upgradeSubId: null, ...props },
  });
}

describe('components/CardPayment', () => {
  beforeEach(() => {
    breakdown.value = planData;
    transactionError.value = undefined;
    processing.value = false;
    state.submit.mockClear();
  });

  it('asks how to pay and shows the card panel next to the order summary', () => {
    const wrapper = mountPage();

    expect(wrapper.get('h1').text()).toBe('How would you like to pay?');
    expect(wrapper.find('[data-testid="card-details"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="order-summary"] [data-testid="grand-total"]').text()).toBe('25.00 €');
    expect(wrapper.get('[data-testid="summary-toggle"]').text()).toContain('25.00 €');
  });

  it('says when the saved cards failed to load, until the buyer dismisses it', async () => {
    expect(mountPage({ cards: [] }).find('[data-testid="cards-load-failed"]').exists()).toBe(false);

    const wrapper = mountPage({ cards: [], cardsFailed: true });
    const notice = wrapper.get('[data-testid="cards-load-failed"]');
    expect(notice.text()).toContain('We couldn\'t load your saved cards.');

    await notice.get('button').trigger('click');
    expect(wrapper.find('[data-testid="cards-load-failed"]').exists()).toBe(false);
  });

  it('names the amount on the pay button, and an upgrade as such', () => {
    expect(mountPage().get('[data-testid="pay"]').text()).toBe('Subscribe and pay 25.00 €');
    expect(mountPage({ upgradeSubId: 'sub-1' }).get('[data-testid="pay"]').text()).toBe('Upgrade and pay 25.00 €');
  });

  it('pays with the selected card only once the policy is accepted', async () => {
    const wrapper = mountPage();
    const pay = wrapper.get('[data-testid="pay"]');

    expect(pay.attributes('disabled')).toBeDefined();

    await wrapper.get('[data-testid="policy-consent"] input').setValue(true);
    expect(pay.attributes('disabled')).toBeUndefined();

    await pay.trigger('click');
    expect(state.submit).toHaveBeenCalledWith(savedCard);
  });

  it('cannot pay without a saved card until the new card form is complete', async () => {
    const wrapper = mountPage({ selectedCard: undefined });

    await wrapper.get('[data-testid="policy-consent"] input').setValue(true);

    expect(wrapper.get('[data-testid="pay"]').attributes('disabled')).toBeDefined();
  });

  it('shows a failed payment above the card panel and lets the buyer dismiss it', async () => {
    transactionError.value = 'Your bank declined the payment.';
    const wrapper = mountPage();

    const alert = wrapper.get('[data-testid="transaction-error"]');
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.text()).toContain('Your bank declined the payment.');

    await alert.get('button[aria-label="Dismiss"]').trigger('click');
    expect(state.setTransactionError).toHaveBeenCalledWith(undefined);
  });

  it('warns that reverse charge does not apply when the VAT ID failed outside Germany', () => {
    expect(mountPage({ country: 'FR', vatIdStatus: VatIdStatus.NOT_VALID }).text()).toContain('No VAT reverse charge applied');
    expect(mountPage({ country: 'DE', vatIdStatus: VatIdStatus.NOT_VALID }).text()).not.toContain('No VAT reverse charge applied');
  });

  it('flags the campaign as applied when the breakdown accepts its code', () => {
    breakdown.value = {
      ...planData,
      discount: { discountAmount: '20', discountType: 'percentage', discountedAmount: '5.00', isReferral: false, isValid: true },
      finalAmount: '20.00',
    };

    const wrapper = mountPage({ discount: { campaign: { code: 'AUTUMN', percent: 20 }, initialCode: 'AUTUMN' } });

    expect(wrapper.emitted('update:campaignApplied')).toEqual([[true]]);
  });
});
