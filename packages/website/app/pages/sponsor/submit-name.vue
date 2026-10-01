<script setup lang="ts">
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import WalletPickerDialog from '~/modules/web3/components/WalletPickerDialog.vue';
import SponsorWalletConnectionCard from '~/modules/web3/sponsorship/components/common/SponsorWalletConnectionCard.vue';
import NftSubmissionForm from '~/modules/web3/sponsorship/components/submission/NftSubmissionForm.vue';
import NftSubmissionsList from '~/modules/web3/sponsorship/components/submission/NftSubmissionsList.vue';
import { useSubmissionFlow } from '~/modules/web3/sponsorship/use-submission-flow';

usePageSeoNoIndex('Submit your sponsor name');

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
  <section class="flex flex-col items-center justify-center">
    <div class="w-full max-w-[520px]">
      <div class="flex flex-col items-center gap-3 text-center mb-8 lg:mb-10">
        <p class="text-rui-primary text-subtitle-1 font-medium">
          {{ t('sponsor.submit_name.eyebrow') }}
        </p>
        <h1 class="text-h4 md:text-h3 !font-bold text-balance">
          {{ t('sponsor.submit_name.title') }}
        </h1>
        <p class="text-body-1 text-rui-text-secondary text-balance">
          {{ t('sponsor.submit_name.description') }}
        </p>
        <i18n-t
          keypath="sponsor.submit_name.not_minted"
          scope="global"
          tag="p"
          class="text-body-2 text-rui-text-secondary"
        >
          <template #link>
            <NuxtLink
              to="/sponsor/mint"
              class="text-rui-primary underline hover:no-underline"
            >
              {{ t('sponsor.submit_name.not_minted_link') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </div>

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
      <div class="mt-6 text-caption text-rui-text-secondary">
        {{ t('sponsor.submit_name.terms_note') }}
      </div>
    </div>

    <WalletPickerDialog />
  </section>
</template>
