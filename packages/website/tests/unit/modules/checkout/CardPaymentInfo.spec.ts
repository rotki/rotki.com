import type { PaymentInfo } from '@rotki/card-payment-common/schemas/three-d-secure';
import type { VueWrapper } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import CardPaymentInfo from '~/modules/checkout/components/card/CardPaymentInfo.vue';

async function mountInfo(paymentInfo: Partial<PaymentInfo> = {}): Promise<VueWrapper> {
  return mountSuspended(CardPaymentInfo, {
    props: {
      paymentInfo: {
        amount: '22.50',
        durationInMonths: '1',
        finalAmount: '22.50',
        renewingPrice: '25',
        ...paymentInfo,
      },
    },
  });
}

describe('cardPaymentInfo', () => {
  it('shows today\'s charge and the monthly renewal in the shared format', async () => {
    const wrapper = await mountInfo();
    const text = wrapper.text();

    expect(text).toContain('22.50 €');
    expect(text).toContain('25.00 € /mo');
    expect(text).toContain('an immediate charge of 22.50 € and recurring payments of 25.00 € /mo');
  });

  it('bills yearly plans per year', async () => {
    const wrapper = await mountInfo({ durationInMonths: '12', finalAmount: '250.00', renewingPrice: '250.00' });

    expect(wrapper.text()).toContain('250.00 € /yr');
    expect(wrapper.text()).not.toContain('/mo');
  });

  it('formats large amounts with grouping', async () => {
    const wrapper = await mountInfo({ finalAmount: '1234.5' });

    expect(wrapper.text()).toContain('1,234.50 €');
  });
});
