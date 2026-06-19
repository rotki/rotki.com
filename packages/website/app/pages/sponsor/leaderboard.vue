<script lang="ts" setup>
import { usePageSeo } from '~/composables/use-page-seo';
import LeaderboardCallToAction from '~/modules/sponsor/leaderboard/components/LeaderboardCallToAction.vue';
import LeaderboardEmptyState from '~/modules/sponsor/leaderboard/components/LeaderboardEmptyState.vue';
import LeaderboardEntryRow from '~/modules/sponsor/leaderboard/components/LeaderboardEntryRow.vue';
import LeaderboardEntrySkeleton from '~/modules/sponsor/leaderboard/components/LeaderboardEntrySkeleton.vue';
import LeaderboardHeader from '~/modules/sponsor/leaderboard/components/LeaderboardHeader.vue';
import { useLeaderboard } from '~/modules/sponsor/leaderboard/composables/use-leaderboard';
import { formatDate } from '~/utils/date';

usePageSeo('Sponsor Leaderboard', 'See the top supporters of rotki, an independent open-source privacy-preserving portfolio tracker. Join the leaderboard by sponsoring a release.', '/sponsor/leaderboard', {
  keywords: 'open source sponsorship, open source funding, privacy software, local-first software, rotki sponsor',
});

definePageMeta({
  layout: 'sponsor',
});

const { t } = useI18n({ useScope: 'global' });

const {
  paginationData,
  loading,
  hasData,
  displayedEntries,
  isEmpty,
  lastUpdated,
  shouldShorten,
  handlePaginationChange,
  copyToClipboard,
} = useLeaderboard();
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <LeaderboardHeader />

    <RuiCard content-class="min-h-[480px]">
      <div class="relative flex flex-col">
        <!-- Loading overlay for pagination -->
        <div
          v-if="loading && hasData"
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
          v-for="(entry, index) in displayedEntries"
          :key="hasData ? entry.rank : index"
        >
          <RuiDivider
            v-if="index > 0"
            class="mt-4 pt-2 w-full"
          />
          <LeaderboardEntryRow
            v-if="hasData"
            :entry="entry"
            :index="index"
            :page="paginationData.page"
            :limit="paginationData.limit"
            :shorten="shouldShorten"
            @copy="copyToClipboard($event)"
          />
          <LeaderboardEntrySkeleton v-else />
        </template>
      </div>

      <!-- Empty State (only when loaded and truly empty) -->
      <LeaderboardEmptyState v-if="isEmpty" />
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

    <!-- Call to Action -->
    <LeaderboardCallToAction />
  </div>
</template>
