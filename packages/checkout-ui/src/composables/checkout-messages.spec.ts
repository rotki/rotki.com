import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createTranslator } from '../utils/translator';
import { provideCheckoutMessages, useCheckoutMessages } from './checkout-messages';

const Child = defineComponent({
  setup() {
    const t = useCheckoutMessages();
    return () => h('span', t('greeting', { name: 'rotki' }));
  },
});

describe('checkout messages', () => {
  it('gives child components the provided translate function', () => {
    const Parent = defineComponent({
      setup() {
        provideCheckoutMessages(createTranslator({ greeting: 'Hello {name}' }));
        return () => h(Child);
      },
    });

    expect(mount(Parent).text()).toBe('Hello rotki');
  });

  it('throws when nothing was provided', () => {
    expect(() => mount(Child)).toThrow('provideCheckoutMessages');
  });
});
