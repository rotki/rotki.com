import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { describe, expect, it } from 'vitest';
import { createApp, ref } from 'vue';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import { installCheckoutMessages } from './checkout-messages';
import { useOrderTotals, type UseOrderTotalsReturn } from './order-totals';

const plan: SelectedPlan = { planId: 3, name: 'basic', price: 25, durationInMonths: 1 };

const breakdown: PaymentBreakdownResponse = {
  braintreeClientToken: 'token',
  discount: null,
  finalAmount: '22.50',
  fullAmount: '25.00',
  nextPayment: 0,
  renewingPrice: '25.00',
  vatAmount: '3.59',
  vatRate: '0.1900',
};

function withMessages(setup: () => UseOrderTotalsReturn): UseOrderTotalsReturn {
  const app = createApp({});
  installCheckoutMessages(app, createTranslator(checkoutMessages));
  return app.runWithContext(setup);
}

describe('useOrderTotals', () => {
  it('has no totals until the plan is known', () => {
    const totals = withMessages(() => useOrderTotals({ plan: undefined, breakdown: undefined }));

    expect(totals.summary.value).toBeUndefined();
    expect(totals.total.value).toBeUndefined();
    expect(totals.totalNote.value).toBeUndefined();
  });

  it('gives the amount due and what each month costs after it', () => {
    const totals = withMessages(() => useOrderTotals({ plan, breakdown }));

    expect(totals.total.value).toBe('22.50 €');
    expect(totals.totalNote.value).toBe('then 25.00 €/month');
  });

  it('says per year for a yearly plan, and follows a new breakdown', () => {
    const current = ref<PaymentBreakdownResponse>();
    const totals = withMessages(() => useOrderTotals({ plan: { ...plan, price: 250, durationInMonths: 12 }, breakdown: current }));

    expect(totals.total.value).toBe('250.00 €');
    current.value = { ...breakdown, finalAmount: '225.00', renewingPrice: '250.00' };

    expect(totals.total.value).toBe('225.00 €');
    expect(totals.totalNote.value).toBe('then 250.00 €/year');
  });
});
