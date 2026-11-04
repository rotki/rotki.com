import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import CheckoutAlert from './CheckoutAlert.vue';

type Props = InstanceType<typeof CheckoutAlert>['$props'];

function mountAlert(props: Partial<Props> = {}): VueWrapper {
  return mount(CheckoutAlert, {
    attachTo: document.body,
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { message: 'Your bank declined the payment.', ...props },
  });
}

describe('checkoutAlert', () => {
  it('announces the error with its title and takes focus', async () => {
    const wrapper = mountAlert({ title: 'Payment failed' });
    await flushPromises();

    const alert = wrapper.get('[role="alert"]');
    expect(alert.text()).toContain('Payment failed');
    expect(alert.text()).toContain('Your bank declined the payment.');
    expect(document.activeElement).toBe(alert.element);
    wrapper.unmount();
  });

  it('takes focus again when the message changes', async () => {
    const wrapper = mountAlert();
    await flushPromises();
    wrapper.get('button').element.focus();

    await wrapper.setProps({ message: 'The card has expired.' });
    await flushPromises();

    expect(document.activeElement).toBe(wrapper.get('[role="alert"]').element);
    wrapper.unmount();
  });

  it('asks to be dismissed', async () => {
    const wrapper = mountAlert();

    await wrapper.get('button[aria-label="Dismiss"]').trigger('click');

    expect(wrapper.emitted('dismiss')).toHaveLength(1);
    wrapper.unmount();
  });
});
