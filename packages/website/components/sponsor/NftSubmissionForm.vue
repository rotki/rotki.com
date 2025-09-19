<script setup lang="ts">
import type { StoredNft, TierKey } from '~/composables/rotki-sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import { useVuelidate } from '@vuelidate/core';
import { email as emailValidation, helpers, maxLength, minLength, numeric, required } from '@vuelidate/validators';
import { get, set } from '@vueuse/shared';
import { useSponsorshipData } from '~/composables/rotki-sponsorship';
import { useRotkiSponsorshipPayment } from '~/composables/rotki-sponsorship/payment';
import { useNftMetadata } from '~/composables/rotki-sponsorship/use-nft-metadata';
import { useNftSubmissions } from '~/composables/rotki-sponsorship/use-nft-submissions';
import { findTierById } from '~/composables/rotki-sponsorship/utils';
import { useSiweAuth } from '~/composables/siwe-auth';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { getTierClasses } from '~/utils/nft-tiers';
import { useLogger } from '~/utils/use-logger';
import { toMessages } from '~/utils/validation';

interface Props {
  address: string | undefined;
  isConnected: boolean;
  editingSubmission?: NftSubmission;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'submission-success': [];
  'cancel-edit': [];
  'edit-submission': [submission: NftSubmission];
}>();

const { t } = useI18n({ useScope: 'global' });
const { fetchNftMetadata } = useNftMetadata();

const displayName = ref<string>('');
const isSubmitting = ref<boolean>(false);
const error = ref<string>('');
const success = ref<boolean>(false);
const imageFile = ref<File | null>(null);
const imagePreview = ref<string>('');
const deleteImage = ref<boolean>(false);
const hasExistingImage = ref<boolean>(false);
const tokenId = ref<string>('');
const email = ref<string>('');
const isCheckingNft = ref<boolean>(false);
const nftTier = ref<TierKey>();
const nftCheckError = ref<string>('');
const nftReleaseId = ref<number>();
const nftReleaseName = ref<string>('');
const nftOwner = ref<string>('');
const isNftOwnerValid = ref<boolean>(false);
const hasCheckedNft = ref<boolean>(false);
const existingSubmission = ref<NftSubmission | null>(null);
const isCheckingExistingSubmission = ref<boolean>(false);

const { currentAddressNfts } = useRotkiSponsorshipPayment();
const { fetchWithCsrf } = useFetchWithCsrf();
const { authenticatedRequest, isAuthenticating, isSessionValid } = useSiweAuth();
const { checkSubmissionByNftId } = useNftSubmissions();
const { data: sponsorshipData } = await useSponsorshipData();

const logger = useLogger();

const isAuthenticated = computed<boolean>(() => props.isConnected && !!props.address && isSessionValid(props.address));

// Compute NFT options including the editing NFT ID if not in the list
const nftIdOptions = computed<StoredNft[]>(() => {
  const currentReleaseId = get(sponsorshipData)?.releaseId;
  let nfts = [...get(currentAddressNfts)];

  // Filter by current release ID if available
  if (currentReleaseId !== undefined) {
    nfts = nfts.filter(nft => nft.releaseId === currentReleaseId);
  }

  // If editing and the NFT ID is not in the list, add it
  if (props.editingSubmission) {
    const editingId = props.editingSubmission.nftId;
    if (!nfts.some(nft => nft.id === editingId)) {
      nfts.push({
        address: props.address?.toLowerCase() || '',
        id: editingId,
        releaseId: currentReleaseId || 1,
        tier: -1, // Unknown tier for external NFTs
      });
    }
  }

  // Filter unique NFTs by ID
  const uniqueNfts = nfts.filter((nft, index, self) =>
    index === self.findIndex(n => n.id === nft.id),
  );

  return uniqueNfts.sort((a, b) => Number(a.id) - Number(b.id)).map(item => ({ ...item, id: item.id.toString() }));
});

// Custom validators
const validNameChars = helpers.withMessage(
  () => t('sponsor.submit_name.error.invalid_chars'),
  (value: string) => !value || /^[\s\w.-]*$/.test(value),
);

const validEmail = helpers.withMessage(
  () => t('sponsor.submit_name.error.invalid_email'),
  emailValidation,
);

const validImageSize = helpers.withMessage(
  () => t('sponsor.submit_name.error.image_too_large'),
  (value: File | null) => !value || value.size <= 5 * 1024 * 1024,
);

const validImageType = helpers.withMessage(
  () => t('sponsor.submit_name.error.invalid_image_type'),
  (value: File | null) => {
    if (!value)
      return true;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(value.type);
  },
);

const atLeastOneRequired = helpers.withMessage(
  () => t('sponsor.submit_name.error.at_least_one_required'),
  () => get(displayName).trim().length > 0 || get(imageFile) !== null || get(email).trim().length > 0,
);

// Validation rules
const rules = computed(() => ({
  displayName: {
    minLength: get(displayName).trim() ? helpers.withMessage(() => t('sponsor.submit_name.error.too_short'), minLength(3)) : {},
    maxLength: get(displayName).trim() ? helpers.withMessage(() => t('sponsor.submit_name.error.too_long'), maxLength(30)) : {},
    validNameChars,
  },
  imageFile: {
    validImageSize,
    validImageType,
  },
  tokenId: {
    required: helpers.withMessage(() => t('sponsor.submit_name.error.token_id_required'), required),
    numeric: helpers.withMessage(() => t('sponsor.submit_name.error.token_id_invalid'), numeric),
  },
  email: {
    validEmail,
  },
  atLeastOne: {
    atLeastOneRequired,
  },
}));

const v$ = useVuelidate(rules, { displayName, imageFile, tokenId, email, atLeastOne: true }, { $autoDirty: true });

function handleImageChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) {
    return;
  }

  set(imageFile, file);

  // If we're replacing an existing image, we don't need to delete it
  set(deleteImage, false);

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    set(imagePreview, reader.result as string);
  };
  reader.readAsDataURL(file);

  // Image changed, will need to re-authenticate if needed
}

function removeImage(): void {
  set(imageFile, null);
  set(imagePreview, '');

  // If we had an existing image, mark it for deletion
  if (get(hasExistingImage)) {
    set(deleteImage, true);
  }
}

async function handleSubmit(): Promise<void> {
  // Validate form
  const isValid = await get(v$).$validate();

  if (!isValid) {
    return;
  }

  try {
    set(error, '');
    set(isSubmitting, true);

    // Check NFT ownership if not already checked
    if (!get(hasCheckedNft)) {
      await checkNftMetadata();

      // After checking, if NFT is not owned by the user, show error and stop
      if (!get(isNftOwnerValid)) {
        set(isSubmitting, false);
        return;
      }
    }

    // Use FormData to send both text data and file
    const formData = new FormData();
    formData.append('evm_address', props.address || '');
    formData.append('display_name', get(displayName).trim());

    const tokenIdVal = get(tokenId);
    if (tokenIdVal) {
      formData.append('nft_id', tokenIdVal);
    }

    const emailVal = get(email).trim();
    if (emailVal) {
      formData.append('email', emailVal);
    }

    const file = get(imageFile);
    if (file) {
      formData.append('image_file', file);
    }

    // Add deleteImage flag if editing and user wants to delete the image
    if (props.editingSubmission && get(deleteImage)) {
      formData.append('delete_image', 'true');
    }

    // Use authenticatedRequest to handle auth and retry logic
    const submitFormData = () => fetchWithCsrf('/webapi/nfts/holder-submission/', {
      method: 'POST',
      body: formData,
    });

    await authenticatedRequest(props.address || '', submitFormData);

    // Reset form
    set(displayName, '');
    set(tokenId, '');
    set(email, '');
    set(imageFile, null);
    set(imagePreview, '');
    set(deleteImage, false);
    set(hasExistingImage, false);

    await nextTick(() => {
      set(success, true);
      get(v$).$reset();
    });
    emit('submission-success');
  }
  catch (error_: any) {
    if (error_.message?.includes('Authentication required')) {
      set(error, t('sponsor.submit_name.error.sign_failed'));
    }
    else {
      set(error, error_.data?.message || t('sponsor.submit_name.error.submit_failed'));
    }
  }
  finally {
    set(isSubmitting, false);
  }
}

async function checkExistingSubmission(nftId: number): Promise<void> {
  if (!props.address)
    return;

  try {
    set(isCheckingExistingSubmission, true);
    const submission = await checkSubmissionByNftId(props.address, nftId);

    if (submission) {
      // Directly populate the form fields with existing submission data
      set(displayName, submission.displayName || '');
      set(email, submission.email || '');

      // Load existing image if available
      if (submission.imageUrl) {
        set(imagePreview, submission.imageUrl);
        set(hasExistingImage, true);
      }
      else {
        set(imagePreview, '');
        set(hasExistingImage, false);
      }

      // Reset file and delete flag
      set(imageFile, null);
      set(deleteImage, false);

      // Store the existing submission for tracking
      set(existingSubmission, submission);

      // Emit edit-submission event to trigger editing mode
      emit('edit-submission', submission);
    }
    else {
      // No existing submission, clear form for new submission
      clearFormForNewSubmission();
    }
  }
  catch (error: any) {
    // If authentication fails, it will be handled when they try to submit
    if (!error.message?.includes('Authentication required')) {
      logger.error('Error checking existing submission:', error);
    }
  }
  finally {
    set(isCheckingExistingSubmission, false);
  }
}

async function checkNftMetadata(): Promise<void> {
  const tokenIdValue = get(tokenId);
  if (!tokenIdValue || !Number.isInteger(Number(tokenIdValue))) {
    set(nftCheckError, t('sponsor.submit_name.error.invalid_token_id'));
    return;
  }

  try {
    set(isCheckingNft, true);
    set(nftCheckError, '');
    set(nftTier, undefined);
    set(nftReleaseId, undefined);
    set(nftReleaseName, '');
    set(nftOwner, '');
    set(isNftOwnerValid, false);
    set(existingSubmission, null);

    // Use the composable to fetch NFT metadata
    const metadata = await fetchNftMetadata(tokenIdValue);

    if (metadata && metadata.tier) {
      set(nftTier, metadata.tier);
      set(nftReleaseId, metadata.releaseId);
      set(nftReleaseName, metadata.releaseName || '');
      set(nftOwner, metadata.owner || '');

      // Check if NFT's releaseId matches current releaseId
      const currentReleaseId = get(sponsorshipData)?.releaseId;
      if (currentReleaseId !== undefined && metadata.releaseId !== currentReleaseId) {
        // Store the release names for use in the template
        set(nftCheckError, 'wrong_release');
        set(nftReleaseName, metadata.releaseName || `Release ${metadata.releaseId}`);
        set(isNftOwnerValid, false);
        return;
      }

      // Check if the NFT is owned by the connected address
      if (metadata.owner && props.address) {
        const isOwner = metadata.owner.toLowerCase() === props.address.toLowerCase();
        set(isNftOwnerValid, isOwner);

        if (!isOwner) {
          set(nftCheckError, t('sponsor.submit_name.error.not_owner'));
        }
        else {
          // Check for existing submission if owner is valid
          await checkExistingSubmission(Number(tokenIdValue));
        }
      }
    }
    else {
      set(nftCheckError, t('sponsor.submit_name.error.nft_not_found'));
    }
  }
  catch (error: any) {
    set(nftCheckError, error.data?.message || t('sponsor.submit_name.error.check_failed'));
  }
  finally {
    set(isCheckingNft, false);
    set(hasCheckedNft, true);
  }
}

function clearFormForNewSubmission(): void {
  set(existingSubmission, null);
  set(displayName, '');
  set(email, '');
  set(imagePreview, '');
  set(hasExistingImage, false);
  set(deleteImage, false);
  set(imageFile, null);
}

const shouldDisableFields = computed(() => get(isSubmitting) || !get(isAuthenticated));

// Watch for changes to clear success message
watch([displayName, imageFile, email], () => {
  // Clear success message when user starts editing
  set(success, false);
});

watch(tokenId, async (newTokenId, oldTokenId) => {
  // Clear success message when user starts editing
  if (newTokenId) {
    set(success, false);
  }

  // Reset NFT metadata when token ID changes
  set(nftTier, undefined);
  set(nftReleaseId, undefined);
  set(nftReleaseName, '');
  set(nftCheckError, '');
  set(nftOwner, '');
  set(isNftOwnerValid, false);
  set(hasCheckedNft, false);

  // Clear the form if token ID is cleared
  if (!newTokenId) {
    clearFormForNewSubmission();
    emit('cancel-edit');
  }
  // Automatically check NFT metadata when a valid token ID is selected
  else if (newTokenId !== oldTokenId && Number.isInteger(Number(newTokenId)) && props.isConnected) {
    await checkNftMetadata();
  }
});

// Load editing submission data
watch(() => props.editingSubmission, (submission) => {
  if (submission && get(tokenId) !== submission.nftId.toString()) {
    set(tokenId, submission.nftId.toString());
    set(displayName, submission.displayName || '');
    set(email, submission.email || '');

    // Load existing image if available
    if (submission.imageUrl) {
      set(imagePreview, submission.imageUrl);
      set(hasExistingImage, true);
    }
    else {
      set(imagePreview, '');
      set(hasExistingImage, false);
    }

    // Reset file and delete flag
    set(imageFile, null);
    set(deleteImage, false);

    // When editing, assume NFT ownership is valid (they already submitted it)
    set(isNftOwnerValid, true);
    // Store existing submission
    set(existingSubmission, submission);
  }
}, { immediate: true });

const route = useRoute();

onMounted(() => {
  const tokenIdParam = route.query.tokenId as string;
  if (tokenIdParam && !props.editingSubmission) {
    set(tokenId, tokenIdParam);
    checkNftMetadata();
  }
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
        v-model="tokenId"
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
          tag="span"
        >
          <template #tokenId>
            {{ tokenId }}
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
        v-model="displayName"
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

        <div
          v-if="!imagePreview"
          class="relative mt-3"
        >
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            class="hidden"
            :disabled="shouldDisableFields"
            @change="handleImageChange($event)"
          />
          <label
            for="image-upload"
            class="flex flex-col items-center justify-center w-full h-32 border border-dashed border-rui-grey-300 dark:border-rui-grey-600 rounded-lg cursor-pointer hover:border-rui-primary transition-colors"
          >
            <RuiIcon
              name="lu-upload"
              size="24"
              class="mb-2 text-rui-text-secondary"
            />
            <span class="text-sm text-rui-text-secondary">{{ t('sponsor.submit_name.upload_image') }}</span>
            <span class="text-xs text-rui-text-disabled mt-1">{{ t('sponsor.submit_name.image_requirements') }}</span>
          </label>
        </div>
        <div
          v-else
          class="relative flex items-start"
        >
          <img
            :src="imagePreview"
            alt="Profile preview"
            class="w-32 h-32 object-cover rounded-lg mt-3"
          />
          <RuiButton
            icon
            size="sm"
            color="error"
            class="-ml-3"
            :disabled="shouldDisableFields"
            @click="removeImage()"
          >
            <RuiIcon
              name="lu-x"
              size="16"
            />
          </RuiButton>
        </div>

        <div
          v-if="toMessages(v$.imageFile).length > 0"
          class="pt-1 px-3 text-rui-error text-sm text-caption"
        >
          <p
            v-for="errorMsg in toMessages(v$.imageFile)"
            :key="errorMsg"
          >
            {{ errorMsg }}
          </p>
        </div>
        <div
          v-else
          class="pt-1 px-3 text-rui-text-secondary text-sm text-caption"
        >
          {{ nftTier === 'silver' ? t('sponsor.submit_name.image_hint_silver') : t('sponsor.submit_name.image_hint_gold') }}
        </div>
      </div>

      <RuiTextField
        v-model="email"
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
          :disabled="!isAuthenticated || v$.$invalid || (hasCheckedNft && !isNftOwnerValid)"
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
