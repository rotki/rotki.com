import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createTranslator } from '../utils/translator';
import { installCheckoutMessages, useCheckoutMessages } from './checkout-messages';

const Child = defineComponent({
  setup() {
    const t = useCheckoutMessages();
    return () => h('span', t('greeting', { name: 'rotki' }));
  },
});

const translate = createTranslator({ greeting: 'Hello {name}' });

describe('checkout messages', () => {
  it('gives every component in the app the installed translate function', () => {
    const wrapper = mount(Child, {
      global: { plugins: [{ install: app => installCheckoutMessages(app, translate) }] },
    });

    expect(wrapper.text()).toBe('Hello rotki');
  });

  it('throws when nothing was supplied', () => {
    expect(() => mount(Child)).toThrow('installCheckoutMessages');
  });
});
