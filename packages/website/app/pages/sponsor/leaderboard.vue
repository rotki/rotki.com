<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import { z } from 'zod';
import AddressAvatar from '~/components/common/AddressAvatar.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { formatDate } from '~/utils/date';
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { getTierMedal } from '~/utils/nft-tiers';
import { truncateAddress } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

interface PaginationData {
  page: number;
  total: number;
  limit: number;
  limits?: number[];
}

// Pagination state
const paginationData = ref<PaginationData>({
  page: 1,
  total: 0,
  limit: 10,
  limits: [10, 25, 50, 100],
});

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

type LeaderboardMetadata = z.infer<typeof LeaderboardMetadata>;

const description = 'rotki\'s sponsor leaderboard';

useHead({
  title: 'Leaderboard | rotki',
  meta: [
    ...getMetadata('Leaderboard | rotki', description, '/sponsor/leaderboard'),
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'sponsor',
  middleware: 'sponsorship',
});

const logger = useLogger();

const loading = ref<boolean>(false);
const leaderboardData = ref<LeaderboardResponse>();

// Clipboard functionality
const clipboardSource = ref('');
const { copy } = useClipboard({ source: clipboardSource });

// i18n
const { t } = useI18n({ useScope: 'global' });
const { fetchWithCsrf } = useFetchWithCsrf();

const lastUpdated = ref<string>('');

// Breakpoint detection
const { isMdAndDown } = useBreakpoint();

const currentLeaderboard = computed<LeaderboardEntry[]>(() => {
  const data = get(leaderboardData);
  if (!data || !data.results)
    return [];

  return data.results;
});

async function fetchLeaderboard(): Promise<void> {
  try {
    set(loading, true);
    const { page, limit } = get(paginationData);
    const offset = (page - 1) * limit;
    const response = await fetchWithCsrf(`/webapi/nfts/leaderboard/`, {
      method: 'GET',
      query: {
        offset,
        limit,
      },
    });
    const validatedResponse = LeaderboardResponse.parse(response);
    set(leaderboardData, validatedResponse);

    // Update total count in pagination
    set(paginationData, {
      ...get(paginationData),
      total: validatedResponse.count,
    });
  }
  catch (error_) {
    logger.error('Error fetching leaderboard:', error_);
  }
  finally {
    set(loading, false);
  }
}

async function fetchLeaderboardMetadata(): Promise<void> {
  try {
    set(loading, true);
    const response = await fetchWithCsrf<LeaderboardMetadata>(`/webapi/nfts/leaderboard/metadata`, {
      method: 'GET',
    });
    set(lastUpdated, LeaderboardMetadata.parse(response).lastUpdated);
  }
  catch (error_) {
    logger.error('Error fetching leaderboard metadata:', error_);
  }
  finally {
    set(loading, false);
  }
}

function formatAddressDisplay(holder: LeaderboardEntry): {
  primary: string;
  secondary: undefined;
  showTooltip: boolean;
  isEns: boolean;
} {
  const shouldShorten = get(isMdAndDown);

  if (holder.ensName) {
    return {
      primary: `${holder.ensName} - ${truncateAddress(holder.address)}`,
      secondary: undefined,
      showTooltip: true,
      isEns: true,
    };
  }
  return {
    primary: shouldShorten ? truncateAddress(holder.address) : holder.address,
    secondary: undefined,
    showTooltip: shouldShorten,
    isEns: false,
  };
}

function copyToClipboard(text: string) {
  set(clipboardSource, text);
  copy();
}

async function handlePaginationChange(newPagination: PaginationData): Promise<void> {
  set(paginationData, newPagination);
  await fetchLeaderboard();
}

onMounted(async () => {
  await Promise.all([
    fetchLeaderboard(),
    fetchLeaderboardMetadata(),
  ]);
});
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
        <RuiCard>
          <div
            v-if="loading"
            class="text-center py-12"
          >
            <RuiProgress
              circular
              color="primary"
              variant="indeterminate"
              size="38"
              class="my-5"
            />
            <p class="text-rui-text-secondary">
              {{ t('sponsor.leaderboard.loading') }}
            </p>
          </div>

          <div
            v-else-if="currentLeaderboard.length > 0"
            class="flex flex-col"
          >
            <template
              v-for="(user, index) in currentLeaderboard"
              :key="user.rank"
            >
              <RuiDivider
                v-if="index > 0"
                class="mt-4 pt-2 w-full"
              />
              <div class="flex items-center space-x-4 flex-1">
                <!-- Avatar (ENS or Blockie) -->
                <AddressAvatar
                  :ens-name="user.ensName"
                  :address="user.address"
                />

                <div class="flex-1">
                  <div class="space-y-1">
                    <RuiTooltip
                      v-if="formatAddressDisplay(user).showTooltip"
                      :open-delay="400"
                    >
                      <template #activator>
                        <h5
                          class="text-sm font-bold cursor-pointer hover:opacity-75 transition-opacity text-primary"
                          @click="copyToClipboard(user.address)"
                        >
                          {{ formatAddressDisplay(user).primary }}
                        </h5>
                      </template>
                      <div class="text-center">
                        <div class="font-mono text-xs">
                          {{ user.address }}
                        </div>
                        <div class="text-xs text-rui-dark-text-secondary mt-1">
                          {{ t('sponsor.leaderboard.tooltip.copy_address') }}
                        </div>
                      </div>
                    </RuiTooltip>
                    <h5
                      v-else
                      class="text-sm font-bold font-mono cursor-pointer hover:opacity-75 transition-opacity"
                      @click="copyToClipboard(user.address)"
                    >
                      {{ formatAddressDisplay(user).primary }}
                    </h5>
                  </div>
                  <div class="text-rui-text-secondary text-sm space-y-1">
                    <div class="flex gap-4">
                      <span>{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('gold'), count: user.goldCount }) }}</span>
                      <span>{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('silver'), count: user.silverCount }) }}</span>
                      <span>{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('bronze'), count: user.bronzeCount }) }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <RuiTooltip :open-delay="400">
                        <template #activator>
                          <RuiChip
                            color="primary"
                            size="sm"
                          >
                            {{ t('sponsor.leaderboard.points', { points: user.points }) }}
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
                    #{{ user.rank || (index + 1 + (paginationData.page - 1) * paginationData.limit) }}
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Empty State -->
          <div
            v-else
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
