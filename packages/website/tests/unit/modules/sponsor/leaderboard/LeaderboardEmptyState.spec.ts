import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import LeaderboardEmptyState from '~/modules/sponsor/leaderboard/components/LeaderboardEmptyState.vue';

describe('leaderboardEmptyState', () => {
  it('renders the empty-state message and placeholder image', async () => {
    const wrapper = await mountSuspended(LeaderboardEmptyState);

    expect(wrapper.text()).toContain('Leaderboard data is empty');
    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('/img/no_data_placeholder.svg');
  });

  it('links to the mint page', async () => {
    const wrapper = await mountSuspended(LeaderboardEmptyState);

    const mintLink = wrapper.findAll('a').find(a => a.attributes('href') === '/sponsor/mint');
    expect(mintLink).toBeDefined();
  });
});
