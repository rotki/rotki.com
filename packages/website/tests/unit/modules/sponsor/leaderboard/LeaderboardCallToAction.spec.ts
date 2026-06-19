import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import LeaderboardCallToAction from '~/modules/sponsor/leaderboard/components/LeaderboardCallToAction.vue';

describe('leaderboardCallToAction', () => {
  it('renders the call-to-action title and description', async () => {
    const wrapper = await mountSuspended(LeaderboardCallToAction);

    expect(wrapper.text()).toContain('Support rotki. Get recognized.');
    expect(wrapper.text()).toContain('Become a Sponsor');
  });

  it('links the sponsor button to the mint page', async () => {
    const wrapper = await mountSuspended(LeaderboardCallToAction);

    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('/sponsor/mint');
  });
});
