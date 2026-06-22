<script setup lang="ts">
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import WalletPickerDialog from '~/modules/web3/components/WalletPickerDialog.vue';
import SponsorWalletConnectionCard from '~/modules/web3/sponsorship/components/common/SponsorWalletConnectionCard.vue';
import NftSubmissionForm from '~/modules/web3/sponsorship/components/submission/NftSubmissionForm.vue';
import NftSubmissionsList from '~/modules/web3/sponsorship/components/submission/NftSubmissionsList.vue';
import { useSubmissionFlow } from '~/modules/web3/sponsorship/use-submission-flow';

usePageSeoNoIndex('Submit Sponsor Name');

definePageMeta({
  layout: 'sponsor',
});

const { t } = useI18n({ useScope: 'global' });

const {
  address,
  editingSubmission,
  handleCancelEdit,
  handleCloseList,
  handleEditSubmission,
  handleSubmissionSuccess,
  isConnected,
  loadSubmissions,
  showSubmissionsList,
} = useSubmissionFlow();
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

    <WalletPickerDialog />
  </section>
</template>
