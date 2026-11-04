import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import type { VueWrapper } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import SelectablePlan from '~/modules/checkout/components/plan/SelectablePlan.vue';
import { type PremiumTiersInfo, PricingPeriod } from '~/types/tiers';

const basic: AvailablePlan = {
  isCustom: false,
  isMostPopular: false,
  monthlyPlan: { planId: 1, price: '25.00' },
  tierName: 'basic',
  yearlyPlan: { planId: 2, price: '250.00' },
};

const tiersInfo: PremiumTiersInfo = [{
  description: [
    { label: 'History events', value: 30000 },
    { label: 'Encrypted backup', value: '150 MB' },
    { label: 'Graphs', value: true },
    { label: 'Staking', value: false },
  ],
  limits: {},
  monthlyPlan: { id: 1, price: '25.00' },
  name: 'basic',
  yearlyPlan: { id: 2, price: '250.00' },
}];

interface MountOptions {
  plan?: AvailablePlan;
  period?: PricingPeriod;
  selected?: boolean;
  disabled?: boolean;
  current?: boolean;
}

async function mountPlan({ plan = basic, period = PricingPeriod.MONTHLY, ...rest }: MountOptions = {}): Promise<VueWrapper> {
  return mountSuspended(SelectablePlan, {
    props: { plan, period, tiersInfo, ...rest },
  });
}

describe('selectablePlan', () => {
  it('shows the monthly price in the shared format, without a saving', async () => {
    const wrapper = await mountPlan();

    expect(wrapper.text()).toContain('25.00 €');
    expect(wrapper.text()).not.toContain('OFF');
    expect(wrapper.find('.line-through').exists()).toBe(false);
  });

  it('shows the yearly price with the saving against twelve monthly payments', async () => {
    const wrapper = await mountPlan({ period: PricingPeriod.YEARLY });
    const text = wrapper.text();

    expect(text).toContain('250.00 €');
    expect(wrapper.find('.line-through').text()).toBe('300.00 €');
    expect(text).toContain('17% OFF');
    expect(text).toContain('20.83 €/mo');
    expect(text).toContain('save 2 months vs monthly');
  });

  it('shows no saving when the yearly plan costs as much as twelve months', async () => {
    const plan: AvailablePlan = { ...basic, yearlyPlan: { planId: 2, price: '300.00' } };
    const wrapper = await mountPlan({ plan, period: PricingPeriod.YEARLY });

    expect(wrapper.text()).toContain('300.00 €');
    expect(wrapper.text()).not.toContain('OFF');
  });

  it('renders nothing for a period the plan does not offer', async () => {
    const plan: AvailablePlan = { ...basic, yearlyPlan: null };
    const wrapper = await mountPlan({ plan, period: PricingPeriod.YEARLY });

    expect(wrapper.text()).toBe('');
  });

  it('emits clear when the selected plan loses its price', async () => {
    const wrapper = await mountPlan({ selected: true });

    await wrapper.setProps({ plan: { ...basic, monthlyPlan: null } });

    expect(wrapper.emitted('clear')).toHaveLength(1);
  });

  it('emits click only while the plan can be chosen', async () => {
    const enabled = await mountPlan();
    await enabled.trigger('click');
    expect(enabled.emitted('click')).toHaveLength(1);

    const disabled = await mountPlan({ disabled: true });
    await disabled.trigger('click');
    expect(disabled.emitted('click')).toBeUndefined();

    const current = await mountPlan({ current: true });
    await current.trigger('click');
    expect(current.emitted('click')).toBeUndefined();
    expect(current.text()).toContain('Current plan');
  });

  it('shows three features and reveals the rest on request', async () => {
    const wrapper = await mountPlan();

    expect(wrapper.findAll('li')).toHaveLength(3);

    await wrapper.find('button[type="button"]').trigger('click');

    expect(wrapper.findAll('li')).toHaveLength(4);
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
