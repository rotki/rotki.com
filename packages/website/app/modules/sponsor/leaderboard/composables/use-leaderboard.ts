import type { Ref } from 'vue';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type LeaderboardEntry,
  LeaderboardMetadataSchema,
  type LeaderboardResponse,
  LeaderboardResponseSchema,
  type PaginationData,
} from '~/modules/sponsor/leaderboard/types';
import { calculateOffset, createPlaceholderEntries } from '~/modules/sponsor/leaderboard/utils';

interface UseLeaderboardReturn {
  paginationData: Readonly<Ref<PaginationData>>;
  loading: Readonly<Ref<boolean>>;
  currentLeaderboard: Readonly<Ref<LeaderboardEntry[]>>;
  displayedEntries: Readonly<Ref<LeaderboardEntry[]>>;
  hasData: Readonly<Ref<boolean>>;
  showSkeleton: Readonly<Ref<boolean>>;
  isEmpty: Readonly<Ref<boolean>>;
  lastUpdated: Readonly<Ref<string>>;
  shouldShorten: Readonly<Ref<boolean>>;
  handlePaginationChange: (newPagination: PaginationData) => Promise<void>;
  copyToClipboard: (text: string) => Promise<void>;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  // Pagination state
  const paginationData = ref<PaginationData>({
    page: 1,
    total: 0,
    limit: 10,
    limits: [10, 25, 50, 100],
  });

  // Clipboard functionality
  const clipboardSource = shallowRef<string>('');
  const { copy } = useClipboard({ source: clipboardSource });

  // Breakpoint detection — addresses are truncated on smaller screens
  const { isMdAndDown } = useBreakpoint();

  // Leaderboard data
  const { data: leaderboardData, pending: loading, refresh: refreshLeaderboard } = useAsyncData<LeaderboardResponse>(
    'leaderboard',
    async () => {
      const { page, limit } = get(paginationData);
      const response = await fetchWithCsrf('/webapi/nfts/leaderboard/', {
        method: 'GET',
        query: { offset: calculateOffset(page, limit), limit },
      });
      return LeaderboardResponseSchema.parse(response);
    },
    {
      default: (): LeaderboardResponse => ({ count: 0, next: null, previous: null, results: [] }),
      lazy: true,
      server: false,
    },
  );

  // Metadata
  const { data: lastUpdated } = useAsyncData<string>(
    'leaderboard-metadata',
    async () => {
      const response = await fetchWithCsrf('/webapi/nfts/leaderboard/metadata', {
        method: 'GET',
      });
      return LeaderboardMetadataSchema.parse(response).lastUpdated ?? '';
    },
    {
      default: () => '',
      lazy: true,
      server: false,
    },
  );

  const currentLeaderboard = computed<LeaderboardEntry[]>(() => get(leaderboardData)?.results ?? []);

  const placeholderEntries = computed<LeaderboardEntry[]>(() => createPlaceholderEntries());

  const hasData = computed<boolean>(() => get(currentLeaderboard).length > 0);

  const isEmpty = computed<boolean>(() =>
    !get(loading) && get(currentLeaderboard).length === 0 && get(leaderboardData)?.count === 0,
  );

  // Skeletons reserve layout only while loading with no data yet — never once an
  // empty response has loaded (that state renders the empty message instead).
  const showSkeleton = computed<boolean>(() => !get(hasData) && !get(isEmpty));

  const displayedEntries = computed<LeaderboardEntry[]>(() =>
    get(showSkeleton) ? get(placeholderEntries) : get(currentLeaderboard),
  );

  // Sync total from response into pagination state
  watch(leaderboardData, (data) => {
    if (data) {
      set(paginationData, {
        ...get(paginationData),
        total: data.count,
      });
    }
  });

  async function copyToClipboard(text: string): Promise<void> {
    set(clipboardSource, text);
    await copy();
  }

  async function handlePaginationChange(newPagination: PaginationData): Promise<void> {
    set(paginationData, newPagination);
    await refreshLeaderboard();
  }

  return {
    paginationData: shallowReadonly(paginationData),
    loading: shallowReadonly(loading),
    currentLeaderboard: shallowReadonly(currentLeaderboard),
    displayedEntries: shallowReadonly(displayedEntries),
    hasData: shallowReadonly(hasData),
    showSkeleton: shallowReadonly(showSkeleton),
    isEmpty: shallowReadonly(isEmpty),
    lastUpdated: shallowReadonly(lastUpdated),
    shouldShorten: shallowReadonly(isMdAndDown),
    handlePaginationChange,
    copyToClipboard,
  };
}
