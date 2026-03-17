<script lang="ts" setup>
import { get, set } from '@vueuse/shared';
import { z } from 'zod';
import AddressAvatar from '~/components/common/AddressAvatar.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePageSeo } from '~/composables/use-page-seo';
import { formatDate } from '~/utils/date';
import { getTierMedal } from '~/utils/nft-tiers';
import { truncateAddress } from '~/utils/text';

interface PaginationData {
  page: number;
  total: number;
  limit: number;
  limits?: number[];
}

const LeaderboardEntry = z.object({
  rank: z.number().nullable(),
  address: z.string(),
  bronzeCount: z.number(),
  silverCount: z.number(),
  goldCount: z.number(),
  totalCount: z.number(),
  points: z.number(),
  ensName: z.string().nullable(),
});

const LeaderboardResponse = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(LeaderboardEntry),
});

type LeaderboardResponse = z.infer<typeof LeaderboardResponse>;

type LeaderboardEntry = z.infer<typeof LeaderboardEntry>;

const LeaderboardMetadata = z.object({
  lastUpdated: z.string().nullable(),
});

usePageSeo('Sponsor Leaderboard', 'See the top supporters of rotki, an independent open-source privacy-preserving portfolio tracker. Join the leaderboard by sponsoring a release.', '/sponsor/leaderboard', {
  keywords: 'open source sponsorship, open source funding, privacy software, local-first software, rotki sponsor',
});

definePageMeta({
  layout: 'sponsor',
});

// Pagination state
const paginationData = ref<PaginationData>({
  page: 1,
  total: 0,
  limit: 10,
  limits: [10, 25, 50, 100],
});

// Clipboard functionality
const clipboardSource = ref<string>('');
const { copy } = useClipboard({ source: clipboardSource });

const { t } = useI18n({ useScope: 'global' });
const { fetchWithCsrf } = useFetchWithCsrf();

// Breakpoint detection
const { isMdAndDown } = useBreakpoint();

// Leaderboard data
const { data: leaderboardData, pending: loading, refresh: refreshLeaderboard } = useAsyncData<LeaderboardResponse>(
  'leaderboard',
  async () => {
    const { page, limit } = get(paginationData);
    const offset = (page - 1) * limit;
    const response = await fetchWithCsrf('/webapi/nfts/leaderboard/', {
      method: 'GET',
      query: { offset, limit },
    });
    return LeaderboardResponse.parse(response);
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
    const response = await fetchWithCsrf<z.infer<typeof LeaderboardMetadata>>('/webapi/nfts/leaderboard/metadata', {
      method: 'GET',
    });
    return LeaderboardMetadata.parse(response).lastUpdated ?? '';
  },
  {
    default: () => '',
    lazy: true,
    server: false,
  },
);

const currentLeaderboard = computed<LeaderboardEntry[]>(() => get(leaderboardData)?.results ?? []);

// Placeholder entries shown during initial load to reserve layout space
const placeholderEntries = computed<LeaderboardEntry[]>(() =>
  Array.from({ length: 5 }, (_, i) => ({
    rank: i + 1,
    address: '',
    bronzeCount: 0,
    silverCount: 0,
    goldCount: 0,
    totalCount: 0,
    points: 0,
    ensName: null,
  })),
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

interface AddressDisplay {
  primary: string;
  showTooltip: boolean;
  isEns: boolean;
}

const addressDisplayMap = computed<Record<string, AddressDisplay>>(() => {
  const shouldShorten = get(isMdAndDown);
  const entries = get(currentLeaderboard);
  const result: Record<string, AddressDisplay> = {};

  for (const holder of entries) {
    if (holder.ensName) {
      result[holder.address] = {
        primary: `${holder.ensName} - ${truncateAddress(holder.address)}`,
        showTooltip: true,
        isEns: true,
      };
    }
    else {
      result[holder.address] = {
        primary: shouldShorten ? truncateAddress(holder.address) : holder.address,
        showTooltip: shouldShorten,
        isEns: false,
      };
    }
  }

  return result;
});

function copyToClipboard(text: string): void {
  set(clipboardSource, text);
  copy();
}

async function handlePaginationChange(newPagination: PaginationData): Promise<void> {
  set(paginationData, newPagination);
  await refreshLeaderboard();
}
</script>

<template>
  <div>
    <div class="container mx-auto px-4">
      <div class="text-center py-6 mb-6 bg-gradient-to-b from-transparent to-rui-primary/[0.05] rounded-xl">
        <h4 class="text-h4 font-bold mb-2">
          {{ t('sponsor.leaderboard.title') }}
        </h4>
        <p class="text-rui-text-secondary">
          {{ t('sponsor.leaderboard.subtitle') }}
        </p>
      </div>

      <div class="max-w-2xl mx-auto">
        <RuiCard content-class="min-h-[480px]">
          <div class="relative flex flex-col">
            <!-- Loading overlay for pagination -->
            <div
              v-if="loading && currentLeaderboard.length > 0"
              class="absolute inset-0 bg-white/80 dark:bg-rui-grey-900/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg"
            >
              <RuiProgress
                variant="indeterminate"
                size="48"
                circular
                color="primary"
              />
            </div>

            <template
              v-for="(entry, index) in (currentLeaderboard.length > 0 ? currentLeaderboard : placeholderEntries)"
              :key="currentLeaderboard.length > 0 ? entry.rank : index"
            >
              <RuiDivider
                v-if="index > 0"
                class="mt-4 pt-2 w-full"
              />
              <div class="flex items-center space-x-4 flex-1 min-h-[74px]">
                <template v-if="currentLeaderboard.length > 0">
                  <!-- Avatar (ENS or Blockie) -->
                  <AddressAvatar
                    :ens-name="entry.ensName"
                    :address="entry.address"
                  />

                  <div class="flex-1">
                    <div class="space-y-1">
                      <RuiTooltip
                        v-if="addressDisplayMap[entry.address]?.showTooltip"
                        :open-delay="400"
                      >
                        <template #activator>
                          <h5
                            class="text-sm font-bold cursor-pointer hover:opacity-75 transition-opacity text-primary"
                            @click="copyToClipboard(entry.address)"
                          >
                            {{ addressDisplayMap[entry.address]?.primary }}
                          </h5>
                        </template>
                        <div class="text-center">
                          <div class="font-mono text-xs">
                            {{ entry.address }}
                          </div>
                          <div class="text-xs text-rui-dark-text-secondary mt-1">
                            {{ t('sponsor.leaderboard.tooltip.copy_address') }}
                          </div>
                        </div>
                      </RuiTooltip>
                      <h5
                        v-else
                        class="text-sm font-bold font-mono cursor-pointer hover:opacity-75 transition-opacity"
                        @click="copyToClipboard(entry.address)"
                      >
                        {{ addressDisplayMap[entry.address]?.primary }}
                      </h5>
                    </div>
                    <div class="text-rui-text-secondary text-sm space-y-1">
                      <div class="flex gap-4">
                        <span>{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('gold'), count: entry.goldCount }) }}</span>
                        <span>{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('silver'), count: entry.silverCount }) }}</span>
                        <span>{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('bronze'), count: entry.bronzeCount }) }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <RuiTooltip :open-delay="400">
                          <template #activator>
                            <RuiChip
                              color="primary"
                              size="sm"
                            >
                              {{ t('sponsor.leaderboard.points', { points: entry.points }) }}
                            </RuiChip>
                          </template>
                          <div>
                            <div>{{ t('sponsor.leaderboard.tooltip.points_breakdown.gold') }}</div>
                            <div>{{ t('sponsor.leaderboard.tooltip.points_breakdown.silver') }}</div>
                            <div>{{ t('sponsor.leaderboard.tooltip.points_breakdown.bronze') }}</div>
                          </div>
                        </RuiTooltip>
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div
                      class="text-2xl font-bold"
                      :class="[
                        paginationData.page === 1 && index <= 2 ? {
                          'text-yellow-400': index === 0,
                          'text-gray-300': index === 1,
                          'text-amber-500': index === 2,
                        } : 'text-rui-text-secondary',
                      ]"
                    >
                      #{{ entry.rank || (index + 1 + (paginationData.page - 1) * paginationData.limit) }}
                    </div>
                  </div>
                </template>

                <!-- Skeleton placeholder row -->
                <template v-else>
                  <RuiSkeletonLoader
                    class="w-10 h-10 shrink-0"
                    rounded="full"
                  />
                  <div class="flex-1 space-y-2">
                    <RuiSkeletonLoader class="w-48 h-4" />
                    <RuiSkeletonLoader class="w-32 h-3" />
                    <RuiSkeletonLoader class="w-16 h-5" />
                  </div>
                  <RuiSkeletonLoader class="w-8 h-7" />
                </template>
              </div>
            </template>
          </div>

          <!-- Empty State (only when loaded and truly empty) -->
          <div
            v-if="!loading && currentLeaderboard.length === 0 && leaderboardData?.count === 0"
            class="text-center py-12"
          >
            <img
              :alt="t('sponsor.leaderboard.empty_state')"
              class="w-24 mx-auto"
              src="/img/no_data_placeholder.svg"
              width="96"
              height="96"
              loading="lazy"
            />
            <p class="text-rui-text-secondary text">
              {{ t('sponsor.leaderboard.empty_state') }}
            </p>
            <i18n-t
              keypath="sponsor.leaderboard.be_the_first"
              scope="global"
            >
              <template #mint>
                <ButtonLink
                  color="primary"
                  inline
                  to="/sponsor/mint"
                >
                  {{ t('sponsor.leaderboard.mint') }}
                </ButtonLink>
              </template>
            </i18n-t>
          </div>
        </RuiCard>

        <p class="text-xs text-rui-text-secondary mt-2 italic">
          {{ lastUpdated ? t('sponsor.leaderboard.last_updated', { date: formatDate(lastUpdated, 'MMMM DD, YYYY HH:mm z') }) : t('sponsor.leaderboard.updated_every_hour') }}
        </p>

        <!-- Pagination -->
        <div
          v-if="paginationData.total > 0"
          class="mt-4"
        >
          <RuiTablePagination
            :model-value="paginationData"
            :loading="loading"
            @update:model-value="handlePaginationChange($event)"
          />
        </div>
      </div>

      <!-- Call to Action -->
      <div class="text-center mt-6 border-t border-default">
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md mx-auto">
          <h3 class="text-2xl font-bold mb-1">
            {{ t('sponsor.leaderboard.call_to_action.title') }}
          </h3>
          <p class="text-rui-text-secondary text-sm mb-4">
            {{ t('sponsor.leaderboard.call_to_action.description') }}
          </p>
          <ButtonLink
            variant="outlined"
            to="/sponsor/mint"
            size="lg"
            color="primary"
            class="mx-auto"
          >
            {{ t('sponsor.leaderboard.call_to_action.button') }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
