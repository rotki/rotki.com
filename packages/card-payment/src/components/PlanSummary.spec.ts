import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaymentBreakdown } from '@/utils/api';
import PlanSummary from './PlanSummary.vue';

vi.mock('@/utils/api', () => ({
  getPaymentBreakdown: vi.fn(),
}));

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

    mount(PlanSummary, { props: { upgrade: false, selectedPlan: plan, discountCode: 'SUMMER' } });
    await flushPromises();

    expect(getPaymentBreakdown).toHaveBeenCalledTimes(1);
    expect(getPaymentBreakdown).toHaveBeenCalledWith({ newPlanId: 3, isCryptoPayment: false, discountCode: 'SUMMER' });
  });

  it('keeps the newest breakdown when an older request resolves last', async () => {
    const pending: ((value: PaymentBreakdownResponse) => void)[] = [];
    vi.mocked(getPaymentBreakdown).mockImplementation(async () => new Promise((resolve) => {
      pending.push(resolve);
    }));

    const wrapper = mount(PlanSummary, { props: { upgrade: false, selectedPlan: plan } });
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
