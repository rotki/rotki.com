import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import PlanLine from './PlanLine.vue';

type Props = InstanceType<typeof PlanLine>['$props'];

function mountLine(props: Partial<Props> = {}, slots: Record<string, () => unknown> = {}): VueWrapper {
  return mount(PlanLine, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { plan: { durationInMonths: 1, name: 'basic' }, ...props },
    slots,
  });
}

describe('planLine', () => {
  it('names the plan and its billing period, with the start date', () => {
    const wrapper = mountLine({ startsAt: new Date(2026, 10, 3) });

    expect(wrapper.get('[data-cy="plan-name"]').text()).toBe('Basic, monthly');
    expect(wrapper.text()).toContain('Monthly subscription');
    expect(wrapper.text()).toContain('Starts November 3, 2026');
    expect(wrapper.text()).not.toContain('Upgrade');
  });

  it('describes a yearly plan', () => {
    const wrapper = mountLine({ plan: { durationInMonths: 12, name: 'ADVANCED' } });

    expect(wrapper.get('[data-cy="plan-name"]').text()).toBe('Advanced, yearly');
    expect(wrapper.text()).toContain('Yearly subscription');
  });

  it('describes a one-time crypto payment without a start date', () => {
    const wrapper = mountLine({ oneTime: true, startsAt: new Date(2026, 10, 3) });

    expect(wrapper.text()).toContain('1 month, paid once');
    expect(wrapper.text()).not.toContain('Starts');
  });

  it('marks an upgrade', () => {
    expect(mountLine({ upgrade: true }).text()).toContain('Upgrade');
  });

  it('places the action next to the plan name', () => {
    const wrapper = mountLine({}, { action: () => h('button', 'Change') });

    expect(wrapper.get('button').text()).toBe('Change');
  });
});
