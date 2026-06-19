import type { LeaderboardEntry } from '~/modules/sponsor/leaderboard/types';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import LeaderboardEntryRow from '~/modules/sponsor/leaderboard/components/LeaderboardEntryRow.vue';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    address: ADDRESS,
    bronzeCount: 1,
    silverCount: 2,
    goldCount: 3,
    totalCount: 6,
    points: 42,
    ensName: null,
    ...overrides,
  };
}

async function mountRow(props: Record<string, unknown>) {
  return mountSuspended(LeaderboardEntryRow, {
    props: { entry: entry(), index: 0, page: 1, limit: 10, ...props },
    global: { stubs: { AddressAvatar: true } },
  });
}

describe('leaderboardEntryRow', () => {
  it('renders the full address without a tooltip when not shortening', async () => {
    const wrapper = await mountRow({ shorten: false });

    const heading = wrapper.find('p.font-mono');
    expect(heading.text()).toBe(ADDRESS);
    expect(heading.classes()).toContain('font-mono');
  });

  it('renders the points and rank', async () => {
    const wrapper = await mountRow({ entry: entry({ rank: 7, points: 42 }) });

    expect(wrapper.text()).toContain('42 points');
    expect(wrapper.text()).toContain('#7');
  });

  it('uses the singular NFT label for a count of one', async () => {
    const wrapper = await mountRow({ entry: entry({ goldCount: 1, silverCount: 2 }) });

    // Gold has exactly one NFT → singular; silver has two → plural.
    expect(wrapper.text()).toContain('1 NFT');
    expect(wrapper.text()).not.toContain('1 NFTs');
    expect(wrapper.text()).toContain('2 NFTs');
  });

  it('computes the rank from page/index when rank is missing', async () => {
    const wrapper = await mountRow({ entry: entry({ rank: null }), index: 2, page: 3, limit: 10 });

    expect(wrapper.text()).toContain('#23');
  });

  it('applies the gold medal class to the first entry on page 1', async () => {
    const wrapper = await mountRow({ index: 0, page: 1 });

    expect(wrapper.find('.text-yellow-400').exists()).toBe(true);
  });

  it('uses the muted rank class on later pages', async () => {
    const wrapper = await mountRow({ index: 0, page: 2 });

    expect(wrapper.find('.text-rui-text-secondary').exists()).toBe(true);
    expect(wrapper.find('.text-yellow-400').exists()).toBe(false);
  });

  it('emits copy with the address when the name is clicked', async () => {
    const wrapper = await mountRow({ shorten: false });

    await wrapper.find('p.font-mono').trigger('click');

    expect(wrapper.emitted('copy')).toEqual([[ADDRESS]]);
  });
});
