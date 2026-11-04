import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import VatNotice from './VatNotice.vue';

describe('vatNotice', () => {
  it('explains the VAT and links to where the VAT ID is fixed', () => {
    const wrapper = mount(VatNotice, {
      global: { plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }] },
      props: { billingHref: 'https://rotki.com/home/billing' },
    });

    expect(wrapper.text()).toBe('No VAT reverse charge applied: your VAT ID could not be verified. Update it in Billing.');
    expect(wrapper.get('a').attributes('href')).toBe('https://rotki.com/home/billing');
  });
});
