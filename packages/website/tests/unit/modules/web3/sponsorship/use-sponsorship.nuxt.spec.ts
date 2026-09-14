import type { TierInfoResult } from '~/modules/web3/sponsorship/types';
import { get } from '@vueuse/shared';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import { server } from '~~/tests/mocks/server';
import { useSponsorshipData } from '~/modules/web3/sponsorship/use-sponsorship';

function tierInfo(overrides: Partial<TierInfoResult> = {}): TierInfoResult {
  return {
    benefits: 'Name in the release changelog',
    currentSupply: 0,
    imageUrl: '',
    maxSupply: 10,
    metadataURI: 'ipfs://bafkrei-tier',
    releaseName: 'v1.45',
    ...overrides,
  };
}

describe('useSponsorshipData', () => {
  afterEach(() => {
    // useAsyncData caches by key in the shared Nuxt instance
    clearNuxtData();
  });

  it('gives every tier an image entry, empty when tier-info omits the tier or has no artwork', async () => {
    // Tier 0 is omitted (its metadata failed on the backend), tier 2 has no artwork
    server.use(http.get('*/api/nft/tier-info', () => HttpResponse.json({
      releaseId: 5,
      tiers: {
        1: tierInfo({ imageUrl: '/api/nft/image?tier=1&release=5' }),
        2: tierInfo({ imageUrl: '' }),
      },
    })));

    const { data, refresh } = useSponsorshipData();
    await refresh();

    expect(get(data)?.nftImages).toEqual({
      bronze: '',
      gold: '',
      silver: '/api/nft/image?tier=1&release=5',
    });
    // Supply is only known for tiers the backend returned
    expect(Object.keys(get(data)?.tierSupply ?? {}).sort()).toEqual(['gold', 'silver']);
    expect(get(data)?.releaseId).toBe(5);
  });
});
