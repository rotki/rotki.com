import type { MaybeRefOrGetter } from 'vue';
import type { StoredNft, TierKey } from '~/modules/web3/sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import { useVuelidate, type ValidationArgs } from '@vuelidate/core';
import { email as emailValidation, helpers, maxLength, minLength, numeric, required } from '@vuelidate/validators';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { buildNftIdOptions, buildSubmissionFormData, evaluateNftMetadata, isSubmitBlockedByOwnership } from '~/modules/web3/sponsorship/submission-state';
import { useNftMetadata } from '~/modules/web3/sponsorship/use-nft-metadata';
import { useNftSubmissions } from '~/modules/web3/sponsorship/use-nft-submissions';
import { useRotkiSponsorshipPayment } from '~/modules/web3/sponsorship/use-payment';
import { useSiweAuth } from '~/modules/web3/sponsorship/use-siwe-auth';
import { useSponsorshipData } from '~/modules/web3/sponsorship/use-sponsorship';
import { getSingleRouteParam } from '~/utils/query';
import { useLogger } from '~/utils/use-logger';

interface SubmissionFormEmit {
  (event: 'submission-success'): void;
  (event: 'cancel-edit'): void;
  (event: 'edit-submission', submission: NftSubmission): void;
}

export interface NftSubmissionFormContext {
  address: MaybeRefOrGetter<string | undefined>;
  isConnected: MaybeRefOrGetter<boolean>;
  editingSubmission: MaybeRefOrGetter<NftSubmission | undefined>;
  emit: SubmissionFormEmit;
}

/**
 * Reactive logic for the NFT holder-submission form: NFT id selection, automatic
 * metadata/ownership checks, existing-submission prefill and authenticated submit.
 * Pure decisions (option list, metadata classification, payload assembly) live in
 * `submission-state.ts`.
 */
export function useNftSubmissionForm(context: NftSubmissionFormContext) {
  const { address, editingSubmission, emit, isConnected } = context;

  const modelDisplayName = shallowRef<string>('');
  const modelTokenId = shallowRef<string>('');
  const modelEmail = shallowRef<string>('');
  const isSubmitting = shallowRef<boolean>(false);
  const error = shallowRef<string>('');
  const success = shallowRef<boolean>(false);
  const imageFile = shallowRef<File>();
  const imagePreview = shallowRef<string>('');
  const deleteImage = shallowRef<boolean>(false);
  const hasExistingImage = shallowRef<boolean>(false);
  const isCheckingNft = shallowRef<boolean>(false);
  const nftTier = shallowRef<TierKey>();
  const nftCheckError = shallowRef<string>('');
  const nftReleaseId = shallowRef<number>();
  const nftReleaseName = shallowRef<string>('');
  const nftOwner = shallowRef<string>('');
  const isNftOwnerValid = shallowRef<boolean>(false);
  const hasCheckedNft = shallowRef<boolean>(false);
  const existingSubmission = shallowRef<NftSubmission>();
  const isCheckingExistingSubmission = shallowRef<boolean>(false);

  const { t } = useI18n({ useScope: 'global' });
  const route = useRoute();
  const logger = useLogger();

  const { currentAddressNfts } = useRotkiSponsorshipPayment();
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { authenticatedRequest, isAuthenticating, isSessionValid } = useSiweAuth();
  const { checkSubmissionByNftId } = useNftSubmissions();
  const { data: sponsorshipData } = useSponsorshipData();
  const { fetchNftMetadata } = useNftMetadata();

  const isAuthenticated = computed<boolean>(() => {
    const addressValue = toValue(address);
    return toValue(isConnected) && !!addressValue && isSessionValid(addressValue);
  });

  const nftIdOptions = computed<StoredNft[]>(() =>
    buildNftIdOptions(get(currentAddressNfts), get(sponsorshipData)?.releaseId, toValue(editingSubmission), toValue(address)));

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
    () => get(modelDisplayName).trim().length > 0 || get(imageFile) !== undefined || get(modelEmail).trim().length > 0,
  );

  const rules = computed<ValidationArgs>(() => ({
    atLeastOne: {
      atLeastOneRequired,
    },
    displayName: {
      maxLength: get(modelDisplayName).trim() ? helpers.withMessage(() => t('sponsor.submit_name.error.too_long'), maxLength(30)) : {},
      minLength: get(modelDisplayName).trim() ? helpers.withMessage(() => t('sponsor.submit_name.error.too_short'), minLength(3)) : {},
      validNameChars,
    },
    email: {
      validEmail,
    },
    imageFile: {
      validImageSize,
      validImageType,
    },
    tokenId: {
      numeric: helpers.withMessage(() => t('sponsor.submit_name.error.token_id_invalid'), numeric),
      required: helpers.withMessage(() => t('sponsor.submit_name.error.token_id_required'), required),
    },
  }));

  const v$ = useVuelidate(rules, { atLeastOne: true, displayName: modelDisplayName, email: modelEmail, imageFile, tokenId: modelTokenId }, { $autoDirty: true });

  const shouldDisableFields = computed<boolean>(() => get(isSubmitting) || !get(isAuthenticated));

  // Editing an existing submission is never gated by the live ownership re-check.
  const ownershipBlocksSubmit = computed<boolean>(() => isSubmitBlockedByOwnership({
    hasCheckedNft: get(hasCheckedNft),
    isEditing: !!toValue(editingSubmission),
    isNftOwnerValid: get(isNftOwnerValid),
  }));

  function handleImageSelected(file: File): void {
    set(imageFile, file);
    // Replacing an existing image means we no longer want to delete it.
    set(deleteImage, false);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string')
        set(imagePreview, reader.result);
    };
    reader.readAsDataURL(file);
  }

  function removeImage(): void {
    set(imageFile, undefined);
    set(imagePreview, '');
    // Mark a previously-saved image for deletion.
    if (get(hasExistingImage))
      set(deleteImage, true);
  }

  function clearFormForNewSubmission(): void {
    set(existingSubmission, undefined);
    set(modelDisplayName, '');
    set(modelEmail, '');
    set(imagePreview, '');
    set(hasExistingImage, false);
    set(deleteImage, false);
    set(imageFile, undefined);
  }

  function prefillFromSubmission(submission: NftSubmission): void {
    set(modelDisplayName, submission.displayName || '');
    set(modelEmail, submission.email || '');

    if (submission.imageUrl) {
      set(imagePreview, submission.imageUrl);
      set(hasExistingImage, true);
    }
    else {
      set(imagePreview, '');
      set(hasExistingImage, false);
    }

    set(imageFile, undefined);
    set(deleteImage, false);
    set(existingSubmission, submission);
  }

  async function checkExistingSubmission(nftId: number): Promise<void> {
    const ownerAddress = toValue(address);
    if (!ownerAddress)
      return;

    try {
      set(isCheckingExistingSubmission, true);
      const submission = await checkSubmissionByNftId(ownerAddress, nftId);

      if (submission) {
        prefillFromSubmission(submission);
        // Switch the page into editing mode for this submission.
        emit('edit-submission', submission);
      }
      else {
        clearFormForNewSubmission();
      }
    }
    catch (error_: any) {
      // Auth failures surface later on submit; ignore them here.
      if (!error_.message?.includes('Authentication required'))
        logger.error('Error checking existing submission:', error_);
    }
    finally {
      set(isCheckingExistingSubmission, false);
    }
  }

  async function checkNftMetadata(): Promise<void> {
    const tokenIdValue = get(modelTokenId);
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
      set(existingSubmission, undefined);

      const metadata = await fetchNftMetadata(tokenIdValue);
      const evaluation = evaluateNftMetadata(metadata, toValue(address), get(sponsorshipData)?.releaseId);

      set(nftTier, evaluation.tier);
      set(nftReleaseId, evaluation.releaseId);
      set(nftReleaseName, evaluation.releaseName);
      set(nftOwner, evaluation.owner);

      switch (evaluation.status) {
        case 'not_found':
          set(nftCheckError, t('sponsor.submit_name.error.nft_not_found'));
          break;
        case 'wrong_release':
          // Sentinel handled specially by the template's i18n block.
          set(nftCheckError, 'wrong_release');
          break;
        case 'not_owner':
          set(nftCheckError, t('sponsor.submit_name.error.not_owner'));
          break;
        case 'ok':
          set(isNftOwnerValid, true);
          await checkExistingSubmission(Number(tokenIdValue));
          break;
        case 'unverified':
          break;
      }
    }
    catch (error_: any) {
      set(nftCheckError, error_.data?.message || t('sponsor.submit_name.error.check_failed'));
    }
    finally {
      set(isCheckingNft, false);
      set(hasCheckedNft, true);
    }
  }

  async function handleSubmit(): Promise<void> {
    const isValid = await get(v$).$validate();
    if (!isValid)
      return;

    try {
      set(error, '');
      set(isSubmitting, true);

      // Verify NFT ownership before the first submit attempt.
      if (!get(hasCheckedNft)) {
        await checkNftMetadata();
        if (!get(isNftOwnerValid)) {
          set(isSubmitting, false);
          return;
        }
      }

      const formData = buildSubmissionFormData({
        address: toValue(address),
        deleteImage: get(deleteImage),
        displayName: get(modelDisplayName),
        email: get(modelEmail),
        imageFile: get(imageFile),
        isEditing: !!toValue(editingSubmission),
        tokenId: get(modelTokenId),
      });

      const submitFormData = async () => fetchWithCsrf('/webapi/nfts/holder-submission/', { body: formData, method: 'POST' });
      await authenticatedRequest(toValue(address) || '', submitFormData);

      set(modelDisplayName, '');
      set(modelTokenId, '');
      set(modelEmail, '');
      set(imageFile, undefined);
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
      if (error_.message?.includes('Authentication required'))
        set(error, t('sponsor.submit_name.error.sign_failed'));
      else
        set(error, error_.data?.message || t('sponsor.submit_name.error.submit_failed'));
    }
    finally {
      set(isSubmitting, false);
    }
  }

  // Clear the success banner once the user edits any field again.
  watch([modelDisplayName, imageFile, modelEmail], () => {
    set(success, false);
  });

  watch(modelTokenId, async (newTokenId, oldTokenId) => {
    if (newTokenId)
      set(success, false);

    // Reset NFT metadata whenever the selected token changes.
    set(nftTier, undefined);
    set(nftReleaseId, undefined);
    set(nftReleaseName, '');
    set(nftCheckError, '');
    set(nftOwner, '');
    set(isNftOwnerValid, false);
    set(hasCheckedNft, false);

    if (!newTokenId) {
      clearFormForNewSubmission();
      emit('cancel-edit');
    }
    else if (newTokenId !== oldTokenId && Number.isInteger(Number(newTokenId)) && toValue(isConnected)) {
      await checkNftMetadata();
    }
  });

  watch(() => toValue(editingSubmission), (submission) => {
    if (submission && get(modelTokenId) !== submission.nftId.toString()) {
      set(modelTokenId, submission.nftId.toString());
      prefillFromSubmission(submission);
      // Ownership was already proven when this submission was first accepted, so
      // editing is not re-gated on the live owner/release check — see
      // `ownershipBlocksSubmit`. (Setting modelTokenId above still refreshes the
      // tier/release info via the modelTokenId watcher.)
    }
  }, { immediate: true });

  onMounted(async () => {
    const tokenIdParam = getSingleRouteParam(route.query.tokenId);
    if (tokenIdParam && !toValue(editingSubmission)) {
      set(modelTokenId, tokenIdParam);
      await checkNftMetadata();
    }
  });

  return {
    error: shallowReadonly(error),
    existingSubmission: shallowReadonly(existingSubmission),
    handleImageSelected,
    handleSubmit,
    hasCheckedNft: shallowReadonly(hasCheckedNft),
    imagePreview: shallowReadonly(imagePreview),
    isAuthenticated,
    isAuthenticating,
    isCheckingNft: shallowReadonly(isCheckingNft),
    isNftOwnerValid: shallowReadonly(isNftOwnerValid),
    isSubmitting: shallowReadonly(isSubmitting),
    modelDisplayName,
    modelEmail,
    modelTokenId,
    nftCheckError: shallowReadonly(nftCheckError),
    nftIdOptions,
    nftReleaseName: shallowReadonly(nftReleaseName),
    nftTier: shallowReadonly(nftTier),
    ownershipBlocksSubmit,
    removeImage,
    shouldDisableFields,
    sponsorshipData,
    success: shallowReadonly(success),
    v$,
  };
}
