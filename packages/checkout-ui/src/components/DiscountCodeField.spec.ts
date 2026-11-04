import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import DiscountCodeField from './DiscountCodeField.vue';

type Props = InstanceType<typeof DiscountCodeField>['$props'];

const referral: PaymentBreakdownResponse['discount'] = {
  discountAmount: '10',
  discountType: DiscountType.PERCENTAGE,
  discountedAmount: '2.50',
  isReferral: true,
  isValid: true,
};

function mountField(props: Partial<Props> = {}): VueWrapper {
  return mount(DiscountCodeField, {
    attachTo: document.body,
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { modelValue: '', ...props },
  });
}

describe('discountCodeField', () => {
  it('offers the general hint, or the running campaign when there is one', () => {
    expect(mountField().text()).toContain('Optional: Enter a discount code');
    expect(mountField({ campaign: { code: 'AUTUMN', percent: 20 } }).text())
      .toContain('Code AUTUMN gives 20% off your first payment.');
  });

  it('applies the typed code and emits it', async () => {
    const wrapper = mountField();
    const submit = wrapper.find('button[type="submit"]');

    expect(submit.attributes('disabled')).toBeDefined();

    await wrapper.find('input').setValue(' SUMMER ');
    expect(submit.attributes('disabled')).toBeUndefined();
    await wrapper.find('form').trigger('submit');

    expect(wrapper.emitted('apply')).toEqual([['SUMMER']]);
    expect(wrapper.emitted('update:modelValue')).toEqual([['SUMMER']]);
  });

  it('shows why a code was rejected and lets the buyer clear it', async () => {
    const wrapper = mountField({ discount: { error: 'This code has expired', isValid: false }, modelValue: 'OLD' });

    expect(wrapper.text()).toContain('This code has expired');
    expect(wrapper.text()).not.toContain('Optional: Enter a discount code');

    await wrapper.find('button[aria-label="Clear discount code"]').trigger('click');

    expect(wrapper.emitted('apply')).toEqual([['']]);
  });

  it('hides the rejection once the buyer edits the code', async () => {
    const wrapper = mountField({ discount: { error: 'This code has expired', isValid: false }, modelValue: 'OLD' });

    await wrapper.find('input').setValue('NEW');

    expect(wrapper.text()).not.toContain('This code has expired');
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('shows an applied referral with what it saves', () => {
    const wrapper = mountField({ discount: referral, modelValue: 'DGXXOU' });

    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.text()).toContain('Referral code applied:');
    expect(wrapper.find('[data-cy="applied-code"]').text()).toBe('DGXXOU');
    expect(wrapper.text()).toContain('You save 2.50 € (10% off)');
    expect(wrapper.text()).toContain('Applies to first payment only');
  });

  it('labels a plain discount code and leaves the percentage out for fixed amounts', () => {
    const wrapper = mountField({
      discount: { ...referral, discountType: DiscountType.FIXED, isReferral: false },
      modelValue: 'SPRING',
    });

    expect(wrapper.text()).toContain('Discount code applied:');
    expect(wrapper.text()).toContain('You save 2.50 €');
    expect(wrapper.text()).not.toContain('off)');
  });

  it('removes an applied code', async () => {
    const wrapper = mountField({ discount: referral, modelValue: 'DGXXOU' });

    await wrapper.find('button[aria-label="Remove discount code"]').trigger('click');

    expect(wrapper.emitted('apply')).toEqual([['']]);
    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
  });
});
