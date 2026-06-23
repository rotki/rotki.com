import type { SimpleTokenMetadata, StoredNft, TierKey } from '~/modules/web3/sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';

/**
 * Options shown in the NFT id selector: the stored NFTs for the connected wallet,
 * narrowed to the current release, plus the edited submission's NFT when it isn't
 * already present, deduplicated by id and sorted ascending (ids stringified for the
 * autocomplete `key-attr`).
 */
export function buildNftIdOptions(nfts: readonly StoredNft[], currentReleaseId: number | undefined, editingSubmission: NftSubmission | undefined, address: string | undefined): StoredNft[] {
  let list = [...nfts];

  if (currentReleaseId !== undefined)
    list = list.filter(nft => nft.releaseId === currentReleaseId);

  if (editingSubmission) {
    const editingId = editingSubmission.nftId;
    if (!list.some(nft => nft.id === editingId)) {
      // Surface the edited NFT even when it isn't in the wallet's stored list.
      list.push({ address: address?.toLowerCase() || '', id: editingId, releaseId: currentReleaseId || 1, tier: -1 });
    }
  }

  const unique = list.filter((nft, index, self) => index === self.findIndex(other => other.id === nft.id));
  return unique
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(item => ({ ...item, id: item.id.toString() }));
}

export interface SubmissionFormInput {
  address: string | undefined;
  displayName: string;
  tokenId: string;
  email: string;
  imageFile: File | undefined;
  deleteImage: boolean;
  isEditing: boolean;
}

/** Assemble the multipart payload for a holder submission, omitting empty optional fields. */
export function buildSubmissionFormData(input: SubmissionFormInput): FormData {
  const formData = new FormData();
  formData.append('evm_address', input.address || '');
  formData.append('display_name', input.displayName.trim());

  if (input.tokenId)
    formData.append('nft_id', input.tokenId);

  const email = input.email.trim();
  if (email)
    formData.append('email', email);

  if (input.imageFile)
    formData.append('image_file', input.imageFile);

  // Only meaningful while editing an existing submission that had an image.
  if (input.isEditing && input.deleteImage)
    formData.append('delete_image', 'true');

  return formData;
}

/**
 * Whether the live on-chain NFT ownership re-check should block submitting.
 *
 * A brand-new submission must pass the owner/release check. Editing an existing
 * submission must NOT: ownership was already proven when it was first accepted,
 * the NFT may now belong to a past release, and the backend re-verifies on
 * submit. Without this carve-out the update button stays disabled for any
 * non-`ok` re-check (e.g. `wrong_release`) until the user re-selects the NFT.
 */
export function isSubmitBlockedByOwnership(params: { hasCheckedNft: boolean; isNftOwnerValid: boolean; isEditing: boolean }): boolean {
  return params.hasCheckedNft && !params.isNftOwnerValid && !params.isEditing;
}

/**
 * Normalize a release tag for comparison: trim, lowercase and drop a leading
 * `v` when it precedes a digit (so `v0.9.0` and `0.9.0` match). The `v` is only
 * stripped before a digit to avoid mangling word-like names.
 */
function normalizeReleaseTag(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase().replace(/^v(?=\d)/, '');
}

/**
 * Whether a submission belongs to the current release and may therefore be
 * edited. The current release name (Go tier-info endpoint) and the submission's
 * release version (Python submissions endpoint) come from different backends and
 * can differ in casing or `v`-prefix, so both are normalized. A missing/unknown
 * value on either side never counts as the current release — editing stays
 * disabled rather than being wrongly enabled for an old submission.
 */
export function isCurrentReleaseSubmission(currentReleaseName: string | undefined, submissionReleaseVersion: string | undefined): boolean {
  const current = normalizeReleaseTag(currentReleaseName);
  return current.length > 0 && current === normalizeReleaseTag(submissionReleaseVersion);
}

export type NftMetadataStatus = 'ok' | 'not_owner' | 'wrong_release' | 'not_found' | 'unverified';

export interface NftMetadataEvaluation {
  status: NftMetadataStatus;
  tier?: TierKey;
  releaseId?: number;
  releaseName: string;
  owner: string;
}

/**
 * Classify fetched NFT metadata against the connected wallet and current release.
 * Pure decision core of the form's NFT check — the composable maps the returned
 * status onto localized error messages and follow-up actions.
 */
export function evaluateNftMetadata(metadata: SimpleTokenMetadata | undefined, address: string | undefined, currentReleaseId: number | undefined): NftMetadataEvaluation {
  if (!metadata || !metadata.tier)
    return { owner: '', releaseName: '', status: 'not_found' };

  const base = {
    owner: metadata.owner || '',
    releaseId: metadata.releaseId,
    releaseName: metadata.releaseName || '',
    tier: metadata.tier,
  };

  if (currentReleaseId !== undefined && metadata.releaseId !== currentReleaseId)
    return { ...base, releaseName: metadata.releaseName || `Release ${metadata.releaseId}`, status: 'wrong_release' };

  if (base.owner && address)
    return { ...base, status: base.owner.toLowerCase() === address.toLowerCase() ? 'ok' : 'not_owner' };

  // Owner or wallet address unavailable: keep the tier/release info but leave ownership unverified.
  return { ...base, status: 'unverified' };
}
