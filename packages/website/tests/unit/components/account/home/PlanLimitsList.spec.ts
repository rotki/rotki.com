import type { PremiumTierInfoDescription } from '~/types/tiers';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import PlanLimitsList from '~/components/account/home/PlanLimitsList.vue';

const limits: PremiumTierInfoDescription[] = [
  { label: 'Historical events limit', value: 100000 },
  { label: 'Encrypted data backups', value: 'Store up to 600MB' },
  { label: 'Graphs', value: true },
  { label: 'Staking analytics', value: false },
  { label: 'Device limit', value: 4 },
];

async function mountLimits(list: PremiumTierInfoDescription[]) {
  return mountSuspended(PlanLimitsList, { props: { limits: list } });
}

function values(wrapper: Awaited<ReturnType<typeof mountLimits>>): string[] {
  return wrapper.findAll('dd').map(value => value.text());
}

describe('plan limits list', () => {
  it('formats numbers, texts and yes or no limits', async () => {
    const wrapper = await mountLimits(limits.slice(0, 4));

    expect(values(wrapper)).toEqual(['100,000', 'Store up to 600MB', 'Included', 'Not included']);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('shows four limits until asked for the rest', async () => {
    const wrapper = await mountLimits(limits);
    expect(values(wrapper)).toHaveLength(4);

    const toggle = wrapper.get('button');
    expect(toggle.text()).toBe('Show more');
    await toggle.trigger('click');
    expect(values(wrapper)).toHaveLength(5);
    expect(toggle.text()).toBe('Show less');

    await toggle.trigger('click');
    expect(values(wrapper)).toHaveLength(4);
  });

  it('renders nothing for a plan without limits', async () => {
    const wrapper = await mountLimits([]);
    expect(wrapper.find('dl').exists()).toBe(false);
  });
});
