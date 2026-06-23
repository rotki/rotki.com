<script setup lang="ts">
import type { StoredNft } from '~/modules/web3/sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import ImageUploadPreview from '~/modules/web3/sponsorship/components/submission/ImageUploadPreview.vue';
import { useNftSubmissionForm } from '~/modules/web3/sponsorship/use-nft-submission-form';
import { findTierById } from '~/modules/web3/sponsorship/utils';
import { getTierClasses } from '~/utils/nft-tiers';
import { toMessages } from '~/utils/validation';

const { address, editingSubmission, isConnected } = defineProps<{
  address: string | undefined;
  isConnected: boolean;
  editingSubmission?: NftSubmission;
}>();

const emit = defineEmits<{
  'submission-success': [];
  'cancel-edit': [];
  'edit-submission': [submission: NftSubmission];
}>();

const { t } = useI18n({ useScope: 'global' });

const {
  error,
  existingSubmission,
  handleImageSelected,
  handleSubmit,
  imagePreview,
  isAuthenticated,
  isAuthenticating,
  isCheckingNft,
  isSubmitting,
  modelDisplayName,
  modelEmail,
  modelTokenId,
  nftCheckError,
  nftIdOptions,
  nftReleaseName,
  nftTier,
  ownershipBlocksSubmit,
  removeImage,
  shouldDisableFields,
  sponsorshipData,
  success,
  v$,
} = useNftSubmissionForm({
  address: () => address,
  editingSubmission: () => editingSubmission,
  emit,
  isConnected: () => isConnected,
});

const [DefineNftIdOption, ReuseNftIdOption] = createReusableTemplate<{
  item: StoredNft;
}>();
</script>

<template>
  <DefineNftIdOption #default="{ item }">
    <div class="flex items-center gap-2">
      <div>
        {{ item.id }}
      </div>
      <div
        v-if="findTierById(item.tier)"
        :class="getTierClasses(findTierById(item.tier)?.key)"
        class="rounded-md px-2 py-0.5 text-xs"
      >
        {{ findTierById(item.tier)?.label }}
      </div>
    </div>
  </DefineNftIdOption>
  <RuiCard class="!p-4">
    <form
      class="flex flex-col gap-6"
      @submit.prevent="handleSubmit()"
    >
      <RuiAutoComplete
        v-model="modelTokenId"
        :label="t('sponsor.submit_name.token_id_label')"
        :hint="t('sponsor.submit_name.token_id_hint')"
        :error-messages="toMessages(v$.tokenId)"
        :disabled="shouldDisableFields"
        :options="nftIdOptions"
        :loading="isCheckingNft"
        key-attr="id"
        text-attr="id"
        clearable
        custom-value
        auto-select-first
        variant="outlined"
        color="primary"
      >
        <template #item="{ item }">
          <ReuseNftIdOption :item="item" />
        </template>
        <template #selection="{ item }">
          <ReuseNftIdOption :item="item" />
        </template>
      </RuiAutoComplete>

      <RuiAlert
        v-if="nftCheckError"
        type="error"
      >
        <i18n-t
          v-if="nftCheckError === 'wrong_release'"
          keypath="sponsor.submit_name.error.wrong_release"
          scope="global"
          tag="span"
        >
          <template #nftRelease>
            <strong>{{ nftReleaseName }}</strong>
          </template>
          <template #currentRelease>
            <strong>{{ sponsorshipData?.releaseName || `Release ${sponsorshipData?.releaseId}` }}</strong>
          </template>
        </i18n-t>
        <template v-else>
          {{ nftCheckError }}
        </template>
      </RuiAlert>
      <RuiAlert
        v-else-if="nftTier"
        type="info"
      >
        <i18n-t
          keypath="sponsor.submit_name.nft_info"
          scope="global"
          tag="span"
        >
          <template #tokenId>
            {{ modelTokenId }}
          </template>
          <template #tier>
            <strong class="uppercase">{{ nftTier }} tier</strong>
          </template>
          <template #releaseName>
            <strong>{{ nftReleaseName }}</strong>
          </template>
        </i18n-t>
      </RuiAlert>

      <RuiTextField
        v-model="modelDisplayName"
        :label="t('sponsor.submit_name.name_label')"
        :hint="t('sponsor.submit_name.name_hint')"
        :error-messages="toMessages(v$.displayName)"
        :disabled="shouldDisableFields"
        variant="outlined"
        color="primary"
      />

      <div v-if="nftTier === 'silver' || nftTier === 'gold'">
        <label class="block text-sm font-medium mb-2">
          {{ t('sponsor.submit_name.image_label') }}
          <span class="text-rui-text-secondary">({{ t('sponsor.submit_name.optional') }})</span>
        </label>

        <ImageUploadPreview
          :image-preview="imagePreview"
          :disabled="shouldDisableFields"
          :error-messages="toMessages(v$.imageFile)"
          :hint="nftTier === 'silver' ? t('sponsor.submit_name.image_hint_silver') : t('sponsor.submit_name.image_hint_gold')"
          @file-selected="handleImageSelected($event)"
          @remove="removeImage()"
        />
      </div>

      <RuiTextField
        v-model="modelEmail"
        :label="t('sponsor.submit_name.email_label')"
        :hint="t('sponsor.submit_name.email_hint')"
        :error-messages="toMessages(v$.email)"
        :disabled="shouldDisableFields"
        type="email"
        variant="outlined"
        color="primary"
      />

      <div v-if="isConnected">
        <RuiButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full"
          :loading="isSubmitting || isAuthenticating"
          :disabled="!isAuthenticated || v$.$invalid || ownershipBlocksSubmit"
        >
          {{ editingSubmission || existingSubmission ? t('sponsor.submit_name.update') : t('sponsor.submit_name.submit') }}
        </RuiButton>
        <p
          v-if="!isAuthenticated"
          class="mt-2 text-sm text-rui-text-secondary text-center"
        >
          {{ t('sponsor.submit_name.sign_required') }}
        </p>
      </div>

      <div v-else>
        <RuiButton
          type="submit"
          color="primary"
          size="lg"
          class="w-full"
          disabled
        >
          {{ editingSubmission || existingSubmission ? t('sponsor.submit_name.update') : t('sponsor.submit_name.submit') }}
        </RuiButton>
        <p class="mt-2 text-sm text-rui-text-secondary">
          {{ t('sponsor.submit_name.connect_to_submit') }}
        </p>
      </div>

      <RuiAlert
        v-if="error"
        type="error"
      >
        {{ error }}
      </RuiAlert>

      <RuiAlert
        v-if="success"
        type="success"
      >
        {{ t('sponsor.submit_name.success') }}
      </RuiAlert>
    </form>
  </RuiCard>
</template>
