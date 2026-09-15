import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BaseButton from './BaseButton.vue';

describe('components/BaseButton', () => {
  it('renders the slot and emits click', async () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Pay now' } });

    expect(wrapper.text()).toBe('Pay now');
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('disables the button and shows a spinner while loading', async () => {
    const wrapper = mount(BaseButton, { props: { loading: true } });

    expect(wrapper.attributes('disabled')).toBeDefined();
    expect(wrapper.find('svg.animate-spin').exists()).toBe(true);
    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mount(BaseButton, { props: { disabled: true } });

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
