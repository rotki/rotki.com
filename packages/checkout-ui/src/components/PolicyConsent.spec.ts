import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import PolicyConsent from './PolicyConsent.vue';

type Props = InstanceType<typeof PolicyConsent>['$props'];

function mountConsent(props: Partial<Props> = {}): VueWrapper {
  return mount(PolicyConsent, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { modelValue: false, policyHref: 'https://rotki.com/refund-policy', ...props },
  });
}

describe('policyConsent', () => {
  it('labels the checkbox with the policy, linked in a new tab', () => {
    const wrapper = mountConsent();

    expect(wrapper.text()).toBe('I agree to the refund and cancellation policy');
    const link = wrapper.get('a');
    expect(link.attributes('href')).toBe('https://rotki.com/refund-policy');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener');
  });

  it('reports the choice', async () => {
    const wrapper = mountConsent();

    await wrapper.get('input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
  });

  it('can be locked while paying', () => {
    expect(mountConsent({ disabled: true }).get('input').attributes('disabled')).toBeDefined();
  });
});
