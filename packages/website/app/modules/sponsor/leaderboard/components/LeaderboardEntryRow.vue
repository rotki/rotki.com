<script lang="ts" setup>
import type { AddressDisplay, LeaderboardEntry } from '~/modules/sponsor/leaderboard/types';
import AddressAvatar from '~/components/common/AddressAvatar.vue';
import { buildAddressDisplay, getDisplayRank, getRankClass } from '~/modules/sponsor/leaderboard/utils';
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

const rankClass = computed<string | Record<string, boolean>>(() => getRankClass(page, index));
</script>

<template>
  <div class="flex items-center space-x-4 flex-1 min-h-[74px]">
    <!-- Avatar (ENS or Blockie) -->
    <AddressAvatar
      :ens-name="entry.ensName"
      :address="entry.address"
    />

    <div class="flex-1">
      <div class="space-y-1">
        <RuiTooltip
          v-if="addressDisplay.showTooltip"
          :open-delay="400"
        >
          <template #activator>
            <p
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
          class="text-sm font-bold font-mono cursor-pointer hover:opacity-75 transition-opacity"
          @click="emit('copy', entry.address)"
        >
          {{ addressDisplay.primary }}
        </p>
      </div>
      <div class="text-rui-text-secondary text-sm space-y-1">
        <div class="flex flex-wrap gap-x-3 gap-y-0.5">
          <span class="whitespace-nowrap">{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('gold'), count: entry.goldCount }, entry.goldCount) }}</span>
          <span class="whitespace-nowrap">{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('silver'), count: entry.silverCount }, entry.silverCount) }}</span>
          <span class="whitespace-nowrap">{{ t('sponsor.leaderboard.nft_counts', { medal: getTierMedal('bronze'), count: entry.bronzeCount }, entry.bronzeCount) }}</span>
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
        :class="[rankClass]"
      >
        #{{ displayRank }}
      </div>
    </div>
  </div>
</template>
