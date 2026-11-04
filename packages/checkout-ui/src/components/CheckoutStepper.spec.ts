import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import CheckoutStepper from './CheckoutStepper.vue';

type Props = InstanceType<typeof CheckoutStepper>['$props'];

function mountStepper(current: Props['current']): VueWrapper {
  return mount(CheckoutStepper, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { current },
  });
}

describe('checkoutStepper', () => {
  it('lists the three steps in a labelled list', () => {
    const list = mountStepper('plan').get('ol');

    expect(list.attributes('aria-label')).toBe('Checkout steps');
    expect(list.findAll('li').map(item => item.text())).toEqual(['1 Plan', '2 Payment', '3 Confirmation']);
  });

  it('marks the current step and ticks the ones before it', () => {
    const items = mountStepper('payment').findAll('li');

    expect(items.map(item => item.attributes('aria-current'))).toEqual([undefined, 'step', undefined]);
    expect(items[0].find('svg').exists()).toBe(true);
    expect(items[0].text()).toBe('Plan');
    expect(items[1].find('svg').exists()).toBe(false);
    expect(items[2].find('svg').exists()).toBe(false);
  });

  it('ticks every earlier step on the confirmation', () => {
    const items = mountStepper('confirmation').findAll('li');

    expect(items.filter(item => item.find('svg').exists())).toHaveLength(2);
    expect(items[2].attributes('aria-current')).toBe('step');
  });

  it('says where the buyer is for phones', () => {
    expect(mountStepper('payment').get('[data-cy="checkout-step-progress"]').text()).toBe('Step 2 of 3');
  });
});
