import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { App } from 'vue';
import { installCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { checkoutMessages } from '@rotki/checkout-ui/messages/en';
import { createTranslator } from '@rotki/checkout-ui/utils/translator';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentBreakdown } from '@/utils/api';
import PlanSummary from './PlanSummary.vue';

vi.mock('@/utils/api', () => ({
  getPaymentBreakdown: vi.fn(),
}));

// PlanLine reads the shared checkout copy, which main.ts installs in the app.
const global = { plugins: [{ install: (app: App): void => installCheckoutMessages(app, createTranslator(checkoutMessages)) }] };

const plan: SelectedPlan = { planId: 3, name: 'basic', price: 25, durationInMonths: 1 };

function breakdownFor(finalAmount: string): PaymentBreakdownResponse {
  return {
    fullAmount: '25.00',
    finalAmount,
    vatRate: '0.19',
    vatAmount: '3.99',
    renewingPrice: '25.00',
    nextPayment: 0,
    discount: null,
  };
}

describe('components/PlanSummary', () => {
  beforeEach(() => {
    vi.mocked(getPaymentBreakdown).mockReset();
  });

  it('fetches the breakdown once on mount', async () => {
    vi.mocked(getPaymentBreakdown).mockResolvedValue(breakdownFor('25.00'));

    mount(PlanSummary, { global, props: { upgrade: false, selectedPlan: plan, discountCode: 'SUMMER' } });
    await flushPromises();

    expect(getPaymentBreakdown).toHaveBeenCalledTimes(1);
    expect(getPaymentBreakdown).toHaveBeenCalledWith({ newPlanId: 3, isCryptoPayment: false, discountCode: 'SUMMER' });
  });

  it('names the plan and when it starts; prices are left to the price rows', async () => {
    vi.mocked(getPaymentBreakdown).mockResolvedValue(breakdownFor('25.00'));

    const wrapper = mount(PlanSummary, { global, props: { upgrade: false, selectedPlan: plan } });
    await flushPromises();

    expect(wrapper.get('[data-cy="plan-name"]').text()).toBe('Basic, monthly');
    expect(wrapper.text()).toContain('Monthly subscription');
    expect(wrapper.text()).toContain('Starts');
    expect(wrapper.text()).not.toContain('€');
  });

  it('marks an upgrade', async () => {
    const advanced: SelectedPlan = { planId: 7, name: 'advanced', price: 450, durationInMonths: 12 };
    vi.mocked(getPaymentBreakdown).mockResolvedValue({ ...breakdownFor('120.00'), fullAmount: '120.00' });

    const wrapper = mount(PlanSummary, { global, props: { upgrade: true, selectedPlan: advanced } });
    await flushPromises();

    expect(wrapper.get('[data-cy="plan-name"]').text()).toBe('Advanced, yearly');
    expect(wrapper.text()).toContain('Upgrade');
  });

  it('keeps the newest breakdown when an older request resolves last', async () => {
    const pending: ((value: PaymentBreakdownResponse) => void)[] = [];
    vi.mocked(getPaymentBreakdown).mockImplementation(async () => new Promise((resolve) => {
      pending.push(resolve);
    }));

    const wrapper = mount(PlanSummary, { global, props: { upgrade: false, selectedPlan: plan } });
    await wrapper.setProps({ discountCode: 'SUMMER' });
    expect(pending).toHaveLength(2);

    pending[1]?.(breakdownFor('20.00'));
    await flushPromises();
    pending[0]?.(breakdownFor('25.00'));
    await flushPromises();

    const updates = wrapper.emitted<[PaymentBreakdownResponse]>('update:breakdown') ?? [];
    expect(updates.map(([value]) => value.finalAmount)).toEqual(['20.00']);
  });
});
