import { mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import CheckoutErrorAlert from '~/modules/checkout/components/common/CheckoutErrorAlert.vue';

const ERROR = { title: 'Payment failed', message: 'Your bank declined the payment.' };

describe('checkoutErrorAlert', () => {
  it('renders nothing without an error', async () => {
    const wrapper = await mountSuspended(CheckoutErrorAlert);

    expect(wrapper.find('[data-cy="checkout-error"]').exists()).toBe(false);
  });

  it('announces the error and moves focus to it', async () => {
    const wrapper = await mountSuspended(CheckoutErrorAlert, { attachTo: document.body });

    await wrapper.setProps({ error: ERROR });
    await flushPromises();

    const alert = wrapper.get('[data-cy="checkout-error"]');
    expect(alert.attributes('role')).toBe('alert');
    expect(alert.text()).toContain('Payment failed');
    expect(alert.text()).toContain('Your bank declined the payment.');
    expect(document.activeElement).toBe(alert.element);
    wrapper.unmount();
  });

  it('asks to be dismissed when closed', async () => {
    const wrapper = await mountSuspended(CheckoutErrorAlert, { props: { error: ERROR } });

    await wrapper.get('[data-cy="checkout-error"] button').trigger('click');

    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });
});
