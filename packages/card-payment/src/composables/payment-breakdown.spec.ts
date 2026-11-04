import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { getPaymentBreakdown } from '@/utils/api';
import { usePaymentBreakdown } from './payment-breakdown';

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

function setup(code = ref<string>(), initial?: PaymentBreakdownResponse): { result: ReturnType<typeof usePaymentBreakdown>; code: typeof code } {
  const scope = effectScope();
  const result = scope.run(() => usePaymentBreakdown(plan, code, initial));
  if (!result)
    throw new Error('composable did not run');
  return { result, code };
}

describe('composables/payment-breakdown', () => {
  beforeEach(() => {
    vi.mocked(getPaymentBreakdown).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('fetches the breakdown for the plan and code right away', async () => {
    vi.mocked(getPaymentBreakdown).mockResolvedValue(breakdownFor('25.00'));

    const { result } = setup(ref<string>('SUMMER'));
    expect(result.loading.value).toBe(true);
    await flushPromises();

    expect(getPaymentBreakdown).toHaveBeenCalledExactlyOnceWith({ newPlanId: 3, isCryptoPayment: false, discountCode: 'SUMMER' });
    expect(result.breakdown.value?.finalAmount).toBe('25.00');
    expect(result.loading.value).toBe(false);
  });

  it('fetches again when the code changes, without one when it is cleared', async () => {
    vi.mocked(getPaymentBreakdown).mockResolvedValue(breakdownFor('25.00'));
    const { code } = setup(ref<string>('SUMMER'));
    await flushPromises();

    code.value = '';
    await flushPromises();

    expect(getPaymentBreakdown).toHaveBeenLastCalledWith({ newPlanId: 3, isCryptoPayment: false });
  });

  it('keeps the newest breakdown when an older request resolves last', async () => {
    const pending: ((value: PaymentBreakdownResponse) => void)[] = [];
    vi.mocked(getPaymentBreakdown).mockImplementation(async () => new Promise((resolve) => {
      pending.push(resolve);
    }));

    const { result, code } = setup();
    code.value = 'SUMMER';
    await flushPromises();
    expect(pending).toHaveLength(2);

    pending[1]?.(breakdownFor('20.00'));
    await flushPromises();
    pending[0]?.(breakdownFor('25.00'));
    await flushPromises();

    expect(result.breakdown.value?.finalAmount).toBe('20.00');
    expect(result.loading.value).toBe(false);
  });

  it('starts from the page\'s breakdown without asking for it again', async () => {
    const { result } = setup(ref<string>(), breakdownFor('25.00'));
    await flushPromises();

    expect(getPaymentBreakdown).not.toHaveBeenCalled();
    expect(result.breakdown.value?.finalAmount).toBe('25.00');
    expect(result.loading.value).toBe(false);
  });

  it('asks for its own breakdown when the page starts with a code', async () => {
    vi.mocked(getPaymentBreakdown).mockResolvedValue(breakdownFor('22.50'));

    const { result } = setup(ref<string>('FRIEND'), breakdownFor('25.00'));
    expect(result.breakdown.value).toBeUndefined();
    await flushPromises();

    expect(getPaymentBreakdown).toHaveBeenCalledExactlyOnceWith({ newPlanId: 3, isCryptoPayment: false, discountCode: 'FRIEND' });
    expect(result.breakdown.value?.finalAmount).toBe('22.50');
  });

  it('keeps the last breakdown when a request fails', async () => {
    vi.mocked(getPaymentBreakdown).mockResolvedValueOnce(breakdownFor('25.00')).mockRejectedValueOnce(new Error('offline'));
    const { result, code } = setup();
    await flushPromises();

    code.value = 'SUMMER';
    await flushPromises();

    expect(result.breakdown.value?.finalAmount).toBe('25.00');
    expect(result.loading.value).toBe(false);
  });
});
