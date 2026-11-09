import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import SavedCardRow from './SavedCardRow.vue';

describe('savedCardRow', () => {
  it('shows the masked number, the expiry and the card logo', () => {
    const wrapper = mount(SavedCardRow, {
      global: {
        plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
      },
      props: { card: { expiresAt: '11/2029', imageUrl: 'https://example.com/visa.png', last4: '1111' } },
    });

    expect(wrapper.text()).toContain('•••• •••• •••• 1111');
    expect(wrapper.text()).toContain('Expires 11/2029');
    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/visa.png');
  });
});
