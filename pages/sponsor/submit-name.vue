<script setup lang="ts">
import type { NftSubmission } from '~/types/sponsor';
import { get, set } from '@vueuse/shared';
import SponsorWalletConnectionCard from '~/components/sponsor/SponsorWalletConnectionCard.vue';
import { useNftSubmissions } from '~/composables/rotki-sponsorship/use-nft-submissions';

definePageMeta({
  layout: 'sponsor',
  middleware: 'sponsorship',
});

const { t } = useI18n({ useScope: 'global' });
const { connected: isConnected, address } = useWeb3Connection();
const { fetchSubmissions } = useNftSubmissions();

const showSubmissionsList = ref<boolean>(false);
const editingSubmission = ref<NftSubmission | undefined>();

async function loadSubmissions(): Promise<void> {
  set(showSubmissionsList, true);
}

function handleEditSubmission(submission: NftSubmission): void {
  set(editingSubmission, submission);
  set(showSubmissionsList, false);
}

function handleCancelEdit(): void {
  set(editingSubmission, undefined);
}

async function handleSubmissionSuccess(): Promise<void> {
  set(editingSubmission, undefined);
  // Refresh submissions list if shown
  const addressVal = get(address);
  if (get(showSubmissionsList) && addressVal) {
    await fetchSubmissions(addressVal);
  }
}

function handleCloseList(): void {
  set(showSubmissionsList, false);
}

watch(isConnected, (connected) => {
  if (!connected) {
    set(showSubmissionsList, false);
    set(editingSubmission, undefined);
  }
});

watch(address, () => {
  set(showSubmissionsList, false);
  set(editingSubmission, undefined);
});
</script>

<template>
  <section class="flex flex-col items-center justify-center px-4 pt-8">
    <div class="w-full max-w-[500px]">
      <h1 class="mb-4 text-3xl font-bold text-center">
        {{ t('sponsor.submit_name.title') }}
      </h1>

      <p class="mb-8 text-center text-body-1 text-rui-text-secondary">
        {{ t('sponsor.submit_name.description') }}
      </p>

      <!-- Wallet Connection Card -->
      <SponsorWalletConnectionCard @view-submissions="loadSubmissions()" />

      <!-- Submissions List -->
      <NftSubmissionsList
        v-if="showSubmissionsList"
        :address="address"
        :is-connected="isConnected"
        @edit-submission="handleEditSubmission($event)"
        @close="handleCloseList()"
      />

      <!-- Submission Form -->
      <NftSubmissionForm
        v-if="!showSubmissionsList"
        :address="address"
        :is-connected="isConnected"
        :editing-submission="editingSubmission"
        @submission-success="handleSubmissionSuccess()"
        @cancel-edit="handleCancelEdit()"
        @edit-submission="handleEditSubmission($event)"
      />

      <!-- Terms Notice -->
      <div class="mt-6 text-sm text-rui-text-secondary">
        {{ t('sponsor.submit_name.terms_note') }}
      </div>
    </div>
  </section>
</template>
