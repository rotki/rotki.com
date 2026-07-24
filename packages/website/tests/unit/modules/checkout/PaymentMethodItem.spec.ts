import type { VueWrapper } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import PaymentMethodItem from '~/modules/checkout/components/method/PaymentMethodItem.vue';

async function mountItem(disabled: boolean): Promise<VueWrapper> {
  return mountSuspended(PaymentMethodItem, {
    props: {
      disabled,
      disabledLabel: 'Not available right now',
      selected: false,
    },
    slots: {
      default: 'icon',
      label: 'Card',
    },
    global: {
      stubs: {
        RuiRadio: true,
      },
    },
  });
}

describe('paymentMethodItem', () => {
  it('does not emit clicks when disabled', async () => {
    const wrapper = await mountItem(true);

    await wrapper.trigger('click');

    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.text()).toContain('Not available right now');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('remains selectable when enabled', async () => {
    const wrapper = await mountItem(false);

    await wrapper.trigger('click');

    expect(wrapper.text()).not.toContain('Not available right now');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
