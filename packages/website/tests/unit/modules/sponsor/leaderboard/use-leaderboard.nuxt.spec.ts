import type { LeaderboardEntry, LeaderboardResponse, PaginationData } from '~/modules/sponsor/leaderboard/types';
import { flushPromises } from '@vue/test-utils';
import { get } from '@vueuse/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockFetchWithCsrf } = vi.hoisted(() => ({ mockFetchWithCsrf: vi.fn() }));

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
    setHooks: vi.fn(),
  }),
}));

const LEADERBOARD_URL = '/webapi/nfts/leaderboard/';
const METADATA_URL = '/webapi/nfts/leaderboard/metadata';

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    address: '0x1234567890abcdef1234567890abcdef12345678',
    bronzeCount: 1,
    silverCount: 2,
    goldCount: 3,
    totalCount: 6,
    points: 42,
    ensName: null,
    ...overrides,
  };
}

function response(overrides: Partial<LeaderboardResponse> = {}): LeaderboardResponse {
  return { count: 1, next: null, previous: null, results: [entry()], ...overrides };
}

/**
 * Routes each mocked request to the matching payload. The leaderboard endpoint
 * resolves with `leaderboard`, the metadata endpoint with `{ lastUpdated }`.
 */
function mockApi(leaderboard: LeaderboardResponse, lastUpdated: string | null = null): void {
  mockFetchWithCsrf.mockImplementation(async (url: string) => {
    if (url === METADATA_URL) {
      return { lastUpdated };
    }
    return leaderboard;
  });
}

const firstPage: PaginationData = { page: 1, total: 0, limit: 10, limits: [10, 25, 50, 100] };

describe('useLeaderboard', () => {
  afterEach(() => {
    // useAsyncData caches by key in the shared Nuxt instance; clear it so state
    // does not leak between tests.
    clearNuxtData();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('fetches the leaderboard with a zero offset on the first page', async () => {
    mockApi(response());
    const { useLeaderboard } = await import('~/modules/sponsor/leaderboard/composables/use-leaderboard');

    const { currentLeaderboard, hasData, handlePaginationChange } = useLeaderboard();
    await handlePaginationChange(firstPage);
    await flushPromises();

    expect(mockFetchWithCsrf).toHaveBeenCalledWith(LEADERBOARD_URL, {
      method: 'GET',
      query: { offset: 0, limit: 10 },
    });
    expect(get(hasData)).toBe(true);
    expect(get(currentLeaderboard)).toHaveLength(1);
  });

  it('syncs the total from the response count into pagination state', async () => {
    mockApi(response({ count: 137 }));
    const { useLeaderboard } = await import('~/modules/sponsor/leaderboard/composables/use-leaderboard');

    const { paginationData, handlePaginationChange } = useLeaderboard();
    await handlePaginationChange(firstPage);
    await flushPromises();

    expect(get(paginationData).total).toBe(137);
  });

  it('shows skeleton placeholders while loading before any data resolves', async () => {
    mockApi(response());
    const { useLeaderboard } = await import('~/modules/sponsor/leaderboard/composables/use-leaderboard');

    // No fetch awaited yet: still loading, no data, not empty → skeletons.
    const { displayedEntries, hasData, showSkeleton } = useLeaderboard();

    expect(get(hasData)).toBe(false);
    expect(get(showSkeleton)).toBe(true);
    expect(get(displayedEntries)).toHaveLength(5);
  });

  it('renders the fetched entries (not placeholders) once data has loaded', async () => {
    mockApi(response({ count: 2, results: [entry({ rank: 1 }), entry({ rank: 2 })] }));
    const { useLeaderboard } = await import('~/modules/sponsor/leaderboard/composables/use-leaderboard');

    const { displayedEntries, hasData, showSkeleton, handlePaginationChange } = useLeaderboard();
    await handlePaginationChange(firstPage);
    await flushPromises();

    expect(get(hasData)).toBe(true);
    expect(get(showSkeleton)).toBe(false);
    expect(get(displayedEntries)).toHaveLength(2);
  });

  it('reports an empty leaderboard once an empty response has loaded', async () => {
    mockApi(response({ count: 0, results: [] }));
    const { useLeaderboard } = await import('~/modules/sponsor/leaderboard/composables/use-leaderboard');

    const { isEmpty, hasData, handlePaginationChange } = useLeaderboard();
    await handlePaginationChange(firstPage);
    await flushPromises();

    expect(get(hasData)).toBe(false);
    expect(get(isEmpty)).toBe(true);
  });

  // Regression: skeleton placeholders must NOT render alongside the empty state.
  // Previously displayedEntries fell back to 5 placeholders whenever there was
  // no data, so a loaded-but-empty leaderboard showed skeletons *and* the empty
  // message at the same time.
  it('does not show skeleton placeholders once an empty response has loaded', async () => {
    mockApi(response({ count: 0, results: [] }));
    const { useLeaderboard } = await import('~/modules/sponsor/leaderboard/composables/use-leaderboard');

    const { displayedEntries, showSkeleton, isEmpty, handlePaginationChange } = useLeaderboard();
    await handlePaginationChange(firstPage);
    await flushPromises();

    expect(get(isEmpty)).toBe(true);
    expect(get(showSkeleton)).toBe(false);
    expect(get(displayedEntries)).toHaveLength(0);
  });
});
