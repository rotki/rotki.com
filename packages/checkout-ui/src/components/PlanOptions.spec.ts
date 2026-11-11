import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import PlanOptions from './PlanOptions.vue';

const PLANS: AvailablePlan[] = [
  { isCustom: false, isMostPopular: false, tierName: 'basic', monthlyPlan: { planId: 3, price: '25.00' }, yearlyPlan: { planId: 4, price: '250.00' } },
  { isCustom: false, isMostPopular: false, tierName: 'advanced', monthlyPlan: { planId: 5, price: '45.00' }, yearlyPlan: null },
];

function mountOptions(currentPlanId: number): VueWrapper<InstanceType<typeof PlanOptions>> {
  return mount(PlanOptions, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { currentPlanId, plans: PLANS },
  });
}

describe('planOptions', () => {
  it('lists the plans of the current plan\'s period and marks the current one', () => {
    const wrapper = mountOptions(3);

    const current = wrapper.get('[data-testid="plan-option"][data-key="3"]');
    expect(current.text()).toContain('Current plan');
    expect(current.attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-testid="plan-option"][data-key="5"]').text()).toContain('45.00 € per month');
    expect(wrapper.get('[data-testid="plan-period"][data-key="monthly"]').attributes('aria-pressed')).toBe('true');
  });

  it('starts on the yearly plans for a yearly plan', () => {
    const wrapper = mountOptions(4);

    expect(wrapper.get('[data-testid="plan-period"][data-key="yearly"]').attributes('aria-pressed')).toBe('true');
  });

  it('leaves out a plan the period does not offer', async () => {
    const wrapper = mountOptions(3);

    await wrapper.get('[data-testid="plan-period"][data-key="yearly"]').trigger('click');

    expect(wrapper.get('[data-testid="plan-option"][data-key="4"]').text()).toContain('250.00 € per year');
    expect(wrapper.find('[data-testid="plan-option"][data-key="5"]').exists()).toBe(false);
  });

  it('hands over the chosen plan', async () => {
    const wrapper = mountOptions(3);

    await wrapper.get('[data-testid="plan-option"][data-key="5"]').trigger('click');

    expect(wrapper.emitted('select')?.[0]).toEqual([{ durationInMonths: 1, name: 'advanced', planId: 5, price: 45 }]);
  });
});
