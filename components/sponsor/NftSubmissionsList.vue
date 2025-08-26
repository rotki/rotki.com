<script setup lang="ts">
import type { SimpleTokenMetadata } from '~/composables/rotki-sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import { get, set } from '@vueuse/shared';
import NftSubmissionItem from '~/components/sponsor/NftSubmissionItem.vue';
import { useNftMetadata } from '~/composables/rotki-sponsorship/use-nft-metadata';
import { useNftSubmissions } from '~/composables/rotki-sponsorship/use-nft-submissions';
import { useLogger } from '~/utils/use-logger';

const props = defineProps<{
  address: string | undefined;
  isConnected: boolean;
}>();

const emit = defineEmits<{
  'edit-submission': [submission: NftSubmission];
  'close': [];
}>();

const { t } = useI18n({ useScope: 'global' });
const { submissions, isLoading: isLoadingSubmissions, error: submissionsError, fetchSubmissions } = useNftSubmissions();
const { open: openWalletConnect } = useWeb3Connection();
const { fetchNftMetadata } = useNftMetadata();

const logger = useLogger();

const nftMetadataCache = ref<Record<number, SimpleTokenMetadata>>({});

async function loadSubmissions(): Promise<void> {
  if (!props.isConnected || !props.address) {
    return;
  }
  await fetchSubmissions(props.address);
}

async function connectWallet(): Promise<void> {
  try {
    await openWalletConnect();
  }
  catch (error) {
    logger.error('Failed to connect wallet:', error);
  }
}

// Fetch NFT metadata for all submissions
watch(submissions, async (newSubmissions) => {
  for (const submission of newSubmissions) {
    if (!get(nftMetadataCache)[submission.nftId]) {
      const metadata = await fetchNftMetadata(submission.nftId);
      if (metadata) {
        set(nftMetadataCache, {
          ...get(nftMetadataCache),
          [submission.nftId]: metadata,
        });
      }
    }
  }
});

onMounted(() => {
  loadSubmissions();
});
</script>

<template>
  <RuiCard class="mb-4">
    <template #custom-header>
      <div class="flex items-center gap-2 p-4 pb-0">
        <RuiButton
          variant="text"
          icon
          size="sm"
          @click="emit('close')"
        >
          <RuiIcon
            name="lu-arrow-left"
          />
        </RuiButton>
        <h2 class="text-lg font-semibold">
          {{ t('sponsor.submit_name.your_submissions') }}
        </h2>
      </div>
    </template>

    <div
      v-if="!isConnected"
      class="flex flex-col items-center py-8 text-center"
    >
      <RuiIcon
        name="lu-wallet"
        size="48"
        class="text-rui-text-disabled mb-4"
      />
      <p class="text-rui-text-secondary mb-4">
        {{ t('sponsor.submit_name.connect_to_view_submissions') }}
      </p>
      <RuiButton
        color="primary"
        @click="connectWallet()"
      >
        <template #prepend>
          <RuiIcon name="lu-wallet" />
        </template>
        {{ t('sponsor.submit_name.connect_wallet') }}
      </RuiButton>
    </div>

    <div
      v-else-if="isLoadingSubmissions"
      class="flex justify-center py-2"
    >
      <RuiProgress
        circular
        color="primary"
        variant="indeterminate"
      />
    </div>

    <RuiAlert
      v-else-if="submissionsError"
      type="error"
    >
      <div class="flex items-center justify-between -my-1">
        <span>{{ submissionsError }}</span>
        <RuiButton
          variant="text"
          size="sm"
          color="primary"
          @click="loadSubmissions()"
        >
          {{ t('sponsor.sponsor_page.nft_image.retry') }}
        </RuiButton>
      </div>
    </RuiAlert>

    <div
      v-else-if="submissions.length === 0"
      class="text-center py-8 text-rui-text-secondary"
    >
      {{ t('sponsor.submit_name.no_submissions') }}
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <NftSubmissionItem
        v-for="submission in submissions"
        :key="submission.nftId"
        :submission="submission"
        :nft-metadata="nftMetadataCache[submission.nftId]"
        @edit-submission="emit('edit-submission', $event)"
      />
    </div>
  </RuiCard>
</template>
