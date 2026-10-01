<script lang="ts" setup>
import type { AddressDisplay, LeaderboardEntry } from '~/modules/sponsor/leaderboard/types';
import AddressAvatar from '~/components/common/AddressAvatar.vue';
import { buildAddressDisplay, getDisplayRank, getRankClass } from '~/modules/sponsor/leaderboard/utils';
import { truncateAddress } from '~/modules/web3/core/format';
import { getTierMedal } from '~/utils/nft-tiers';

const { entry, index, page, limit, shorten = false } = defineProps<{
  entry: LeaderboardEntry;
  index: number;
  page: number;
  limit: number;
  shorten?: boolean;
}>();

const emit = defineEmits<{
  copy: [address: string];
}>();

const { t } = useI18n({ useScope: 'global' });

const addressDisplay = computed<AddressDisplay>(() => buildAddressDisplay(entry, shorten));

const displayRank = computed<number>(() => getDisplayRank(entry, index, page, limit));

const rankClass = computed<string>(() => getRankClass(page, index));
</script>

<template>
  <div class="flex items-center gap-3 sm:gap-4 flex-1 min-h-[64px]">
    <!-- Rank leads the row, as on any leaderboard -->
    <div
      data-id="leaderboard-rank"
      class="min-w-10 h-10 px-1.5 shrink-0 rounded-full flex items-center justify-center text-body-1 font-bold tabular-nums"
      :class="rankClass"
    >
      #{{ displayRank }}
    </div>

    <!-- Avatar (ENS or Blockie) -->
    <AddressAvatar
      :ens-name="entry.ensName"
      :address="entry.address"
    />

    <!-- On phones the points chip drops under the name so the counts keep one line -->
    <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4">
      <div class="flex-1 min-w-0">
        <div class="space-y-1">
          <RuiTooltip
            v-if="addressDisplay.showTooltip"
            :open-delay="400"
          >
            <template #activator>
              <!-- ENS name and address on separate lines, so the name reads first -->
              <p
                v-if="entry.ensName"
                class="text-sm font-bold truncate cursor-pointer hover:opacity-75 transition-opacity"
                @click="emit('copy', entry.address)"
              >
                {{ entry.ensName }}
                <span class="block font-mono text-xs font-normal text-rui-text-secondary">{{ truncateAddress(entry.address) }}</span>
              </p>
              <p
                v-else
                class="text-sm font-bold cursor-pointer hover:opacity-75 transition-opacity text-primary"
                @click="emit('copy', entry.address)"
              >
                {{ addressDisplay.primary }}
              </p>
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
          <p
            v-else
            class="text-sm font-medium font-mono truncate cursor-pointer hover:opacity-75 transition-opacity"
            @click="emit('copy', entry.address)"
          >
            {{ addressDisplay.primary }}
          </p>
        </div>
        <div class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-rui-text-secondary text-sm">
          <!-- Zero counts are left out; they were most of the row's noise -->
          <span
            v-if="entry.goldCount > 0"
            class="whitespace-nowrap"
          >
            {{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('gold'), count: entry.goldCount }, entry.goldCount) }}
          </span>
          <span
            v-if="entry.silverCount > 0"
            class="whitespace-nowrap"
          >
            {{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('silver'), count: entry.silverCount }, entry.silverCount) }}
          </span>
          <span
            v-if="entry.bronzeCount > 0"
            class="whitespace-nowrap"
          >
            {{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('bronze'), count: entry.bronzeCount }, entry.bronzeCount) }}
          </span>
        </div>
      </div>
      <RuiTooltip
        :open-delay="400"
        class="shrink-0 self-start sm:self-auto"
      >
        <template #activator>
          <!-- A tint rather than a solid chip: ten identical filled chips outweighed the names -->
          <span class="inline-flex items-center rounded-full bg-rui-primary/[0.08] px-2.5 py-0.5 text-body-2 font-medium text-rui-primary tabular-nums whitespace-nowrap cursor-help">
            {{ t('sponsor.leaderboard.points', { points: entry.points }) }}
          </span>
        </template>
        <div>
          <div>{{ t('sponsor.leaderboard.tooltip.points_breakdown.gold') }}</div>
          <div>{{ t('sponsor.leaderboard.tooltip.points_breakdown.silver') }}</div>
          <div>{{ t('sponsor.leaderboard.tooltip.points_breakdown.bronze') }}</div>
        </div>
      </RuiTooltip>
    </div>
  </div>
</template>
