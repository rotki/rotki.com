<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import { z } from 'zod';
import { fetchWithCsrf } from '~/utils/api';
import { formatDate } from '~/utils/date';

definePageMeta({
  layout: 'sponsor',
});

const loading = ref(false);
const leaderboardData = ref<LeaderboardResponse | null>(null);

// Clipboard functionality
const clipboardSource = ref('');
const { copy } = useClipboard({ source: clipboardSource });

const LeaderboardEntry = z.object({
  rank: z.number(),
  address: z.string(),
  bronzeCount: z.number(),
  silverCount: z.number(),
  goldCount: z.number(),
  points: z.number(),
  ensName: z.string().nullable().optional(),
});

const LeaderboardResponse = z.object({
  total: z.number(),
  lastUpdated: z.string().datetime(),
  data: z.array(LeaderboardEntry),
});

type LeaderboardResponse = z.infer<typeof LeaderboardResponse>;

const currentLeaderboard = computed(() => {
  const data = get(leaderboardData);
  if (!data || !data.data)
    return [];

  return data.data;
});

async function fetchLeaderboard() {
  try {
    set(loading, true);
    const response = await fetchWithCsrf('/webapi/leaderboard/');
    const validatedResponse = LeaderboardResponse.parse(response);
    set(leaderboardData, validatedResponse);
  }
  catch (error_) {
    console.error('Error fetching leaderboard:', error_);
  }
  finally {
    set(loading, false);
  }
}

function formatAddressDisplay(holder: z.infer<typeof LeaderboardEntry>) {
  if (holder.ensName) {
    return {
      primary: `${holder.ensName} - ${shortenAddress(holder.address)}`,
      secondary: null,
      showTooltip: true,
      isEns: true,
    };
  }
  return {
    primary: holder.address,
    secondary: null,
    showTooltip: false,
    isEns: false,
  };
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function copyToClipboard(text: string) {
  set(clipboardSource, text);
  copy();
}

onMounted(async () => {
  await fetchLeaderboard();
});
</script>

<template>
  <div>
    <div class="container mx-auto px-4">
      <div class="text-center py-6 mb-6 bg-gradient-to-b from-transparent to-rui-primary/[0.05] rounded-xl">
        <h4 class="text-h4 font-bold mb-2">
          Sponsor Leaderboard
        </h4>
        <p class="text-rui-text-secondary">
          Our top supporters making a difference
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
            />
            <p class="text-rui-text-secondary">
              Loading leaderboard...
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
                          Click to copy full address
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
                      <span>🥉 {{ user.bronzeCount }} NFTs</span>
                      <span>🥈 {{ user.silverCount }} NFTs</span>
                      <span>🥇 {{ user.goldCount }} NFTs</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <RuiTooltip :open-delay="400">
                        <template #activator>
                          <RuiChip
                            color="primary"
                            size="sm"
                          >
                            {{ user.points }} points
                          </RuiChip>
                        </template>
                        <div>
                          <div>Gold = 10 pts</div>
                          <div>Silver = 5 pts</div>
                          <div>Bronze = 1 pts</div>
                        </div>
                      </RuiTooltip>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div
                    class="text-2xl font-bold"
                    :class="[
                      index === 0 ? 'text-yellow-400'
                      : index === 1 ? 'text-gray-300'
                        : index === 2 ? 'text-amber-500'
                          : 'text-rui-text-secondary',
                    ]"
                  >
                    #{{ user.rank }}
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
              alt="No leaderboard data available"
              class="w-24 mx-auto"
              src="/img/not-found.svg"
            />
            <p class="text-rui-text-secondary text-lg">
              No leaderboard data available
            </p>
          </div>
        </RuiCard>

        <p
          v-if="leaderboardData?.lastUpdated"
          class="text-xs text-rui-text-secondary mt-2 italic"
        >
          Last Updated: {{ formatDate(leaderboardData.lastUpdated, 'MMMM DD, YYYY hh:mm') }}
        </p>
      </div>

      <!-- Call to Action -->
      <div class="text-center mt-6">
        <div class="bg-white/10 backdrop-blur-md rounded-xl p-8 max-w-md mx-auto">
          <h3 class="text-2xl font-bold mb-1">
            Join Our Sponsors
          </h3>
          <p class="text-rui-text-secondary text-sm mb-4">
            Support our project and see your name on this leaderboard!
          </p>
          <ButtonLink
            variant="outlined"
            to="/sponsor/sponsor"
            size="lg"
            color="primary"
            class="mx-auto"
          >
            Become a Sponsor
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
